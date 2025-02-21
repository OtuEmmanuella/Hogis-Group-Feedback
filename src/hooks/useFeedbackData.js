import { useQuery, useQueries, useQueryClient } from '@tanstack/react-query';
import { 
  collection, 
  getDocs, 
  query, 
  orderBy, 
  limit, 
  startAfter, 
  where, 
  getCountFromServer,
  documentId,
  startAt,
} from 'firebase/firestore';
import { db } from '../firebase/config';

const FEEDBACK_PER_PAGE = 10;

// Cache for last document references
let lastDocRefs = {};

// Utility to format Firestore timestamp
const formatFirestoreData = (doc) => {
  const data = doc.data();
  return {
    id: doc.id,
    ...data,
    createdAt: data.createdAt?.toDate(),
  };
};

// Custom error for feedback operations
class FeedbackError extends Error {
  constructor(message, code) {
    super(message);
    this.name = 'FeedbackError';
    this.code = code;
  }
}

// Fetch paginated feedback
export const usePaginatedFeedback = (page) => {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ['feedback', page],
    queryFn: async () => {
      try {
        const feedbackRef = collection(db, 'feedback');
        let q;

        if (page === 1) {
          // First page query
          q = query(
            feedbackRef,
            orderBy('createdAt', 'desc'),
            limit(FEEDBACK_PER_PAGE)
          );
        } else {
          // Use cached last document reference
          const lastDoc = lastDocRefs[page - 1];
          if (!lastDoc) {
            throw new FeedbackError('Previous page data not found', 'PAGINATION_ERROR');
          }

          q = query(
            feedbackRef,
            orderBy('createdAt', 'desc'),
            startAfter(lastDoc),
            limit(FEEDBACK_PER_PAGE)
          );
        }

        const snapshot = await getDocs(q);

        // Cache the last document for next page
        if (snapshot.docs.length > 0) {
          lastDocRefs[page] = snapshot.docs[snapshot.docs.length - 1];
        }

        // Prefetch next page
        if (snapshot.docs.length === FEEDBACK_PER_PAGE) {
          const nextPageQuery = query(
            feedbackRef,
            orderBy('createdAt', 'desc'),
            startAfter(snapshot.docs[snapshot.docs.length - 1]),
            limit(FEEDBACK_PER_PAGE)
          );
          queryClient.prefetchQuery({
            queryKey: ['feedback', page + 1],
            queryFn: () => getDocs(nextPageQuery)
          });
        }

        return snapshot.docs.map(formatFirestoreData) || []; // Ensure we always return an array
      } catch (error) {
        console.error('Error fetching feedback:', error);
        return []; // Return empty array on error instead of throwing
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    cacheTime: 1000 * 60 * 30, // 30 minutes
  });
};

    
// Analytics hook with parallel queries
export const useAnalytics = () => {
  const queries = useQueries({
    queries: [
      // Total feedback count
      {
        queryKey: ['analytics', 'totals'],
        queryFn: async () => {
          try {
            const feedbackRef = collection(db, 'feedback');
            const snapshot = await getCountFromServer(feedbackRef);
            return snapshot.data().count;
          } catch (error) {
            console.error('Error fetching total count:', error);
            throw new FeedbackError(
              'Failed to fetch total feedback count',
              'ANALYTICS_ERROR'
            );
          }
        },
        staleTime: 1000 * 60 * 15, // 15 minutes
      },

      // Sentiment analysis
      {
        queryKey: ['analytics', 'sentiment'],
        queryFn: async () => {
          try {
            const feedbackRef = collection(db, 'feedback');
            const reactions = ['positive', 'negative', 'neutral'];
            
            const counts = await Promise.all(
              reactions.map(async (reaction) => {
                const reactionQuery = query(
                  feedbackRef, 
                  where('reaction', '==', reaction)
                );
                const count = await getCountFromServer(reactionQuery);
                return { reaction, count: count.data().count };
              })
            );

            return counts.reduce((acc, { reaction, count }) => {
              acc[reaction] = count;
              return acc;
            }, {});
          } catch (error) {
            console.error('Error fetching sentiment data:', error);
            throw new FeedbackError(
              'Failed to fetch sentiment analysis',
              'ANALYTICS_ERROR'
            );
          }
        },
        staleTime: 1000 * 60 * 15, // 15 minutes
      },

      // Venue analytics
      {
        queryKey: ['analytics', 'venues'],
        queryFn: async () => {
          try {
            const feedbackRef = collection(db, 'feedback');
            const snapshot = await getDocs(
              query(feedbackRef, where('venue', '!=', null))
            );

            const venues = snapshot.docs.reduce((acc, doc) => {
              const venue = doc.data().venue;
              if (venue) {
                acc[venue] = (acc[venue] || 0) + 1;
              }
              return acc;
            }, {});

            // Sort venues by feedback count
            return Object.fromEntries(
              Object.entries(venues).sort(([, a], [, b]) => b - a)
            );
          } catch (error) {
            console.error('Error fetching venue data:', error);
            throw new FeedbackError(
              'Failed to fetch venue analytics',
              'ANALYTICS_ERROR'
            );
          }
        },
        staleTime: 1000 * 60 * 15, // 15 minutes
      },
    ],
  });

  // Process and combine query results
  const isLoading = queries.some(query => query.isLoading);
  const isError = queries.some(query => query.isError);
  const errors = queries
    .filter(query => query.error)
    .map(query => query.error);

  return {
    isLoading,
    isError,
    errors: errors.length > 0 ? errors : null,
    data: isLoading || isError ? null : {
      totalFeedback: queries[0].data,
      sentiment: queries[1].data,
      venues: queries[2].data,
    },
  };
};

// Hook for fetching feedback by ID
export const useFeedbackById = (feedbackId) => {
  return useQuery({
    queryKey: ['feedback', feedbackId],
    queryFn: async () => {
      try {
        if (!feedbackId) {
          throw new FeedbackError('Feedback ID is required', 'INVALID_PARAMS');
        }

        const feedbackRef = collection(db, 'feedback');
        const q = query(feedbackRef, where(documentId(), '==', feedbackId));
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
          throw new FeedbackError('Feedback not found', 'NOT_FOUND');
        }

        return formatFirestoreData(snapshot.docs[0]);
      } catch (error) {
        console.error('Error fetching feedback by ID:', error);
        throw new FeedbackError(
          error.message || 'Failed to fetch feedback',
          error.code || 'FETCH_ERROR'
        );
      }
    },
    enabled: !!feedbackId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    cacheTime: 1000 * 60 * 30, // 30 minutes
  });
};

// Export constants and utilities
export const ANALYTICS_REFRESH_INTERVAL = 1000 * 60 * 15; // 15 minutes
export const FEEDBACK_CACHE_TIME = 1000 * 60 * 30; // 30 minutes
export { FeedbackError };