import { compose, operation, variable } from "../src";
import { fromVariable } from "../src";


/**
 * Output:
 * ```gql
 * query UsersQuery($token: String!, $addedDate: Date, $includeFriends: Boolean) @auth(token: $token) {
 *   users {
 *     edges {
 *       node {
 *         id
 *         name
 *         email
 *         __typename
 *         recentFriends: friendsConnection(addedDate: $addedDate) @include(if: $includeFriends) {
 *           edges {
 *             cursor
 *             node {
 *               id
 *               name
 *               email
 *               __typename
 *             }
 *           }
 *           pageInfo {
 *             hasNextPage
 *             hasPreviousPage
 *           }
 *         }
 *       }
 *     }
 *   }
 * }
 * ```
 */
const QUERY = compose(operation('query', {
  __operationName: 'UsersQuery',
  __variables: {
    token: variable('skajdhaskjdh-kjsdha-askdhsakldjh', 'String', true),
    addedDate: variable(Date.now().toString(), 'Date', false),
    includeFriends: variable(true, 'Boolean', false)
  },
  __directives: [
    {
      name: 'auth',
      args: {
        token: fromVariable('token')
      }
    }
  ],
  users: {
    __connection: true,
    edges: {
      node: {
        __toLocalType: 'User',
        __scalars: ['id', 'name', 'email', '__typename'],
        friendsConnection: {
          __alias: 'recentFriends',
          __args: {
            addedDate: fromVariable('addedDate')
          },
          __directives: [
            {
              name: 'inlcude',
              args: {
                if: fromVariable('includeFriends')
              }
            }
          ],
          edges: {
            node: {
              __scalars: ['id', 'name', 'email', '__typename'],
            },
            __scalars: ['cursor']
          },
          pageInfo: {
            __scalars: ['hasNextPage', 'hasPreviousPage'],
          }
        }
      }
    }
  }
}));


/**
 * Output
 * ```gql
 * mutation CreateReviewForEpisode($ep: Episode!, $review: ReviewInput!) {
 *   createReview(episode: $ep, review: $review) {
 *     stars
 *     commentary
 *   }
 * }
 * ```
 */
const MUTATION = compose(operation('mutation', {
  __operationName: 'CreateReviewForEpisode',
  __variables: {
    ep: variable('Jedi', 'Episode', true),
    review: variable({
      stars: 5,
      commentary: "This is a great movie!"
    }, 'ReviewInput', true),
  },
  createReview: {
    __scalars: ['stars', 'commentary'],
    __args: {
      ep: fromVariable('ep'),
      review: fromVariable('review')
    }
  }
}));

/**
 * Output
 * ```gql
 * subscription StoryLikeSubscription($input: StoryLikeSubscribeInput) {
 *   storyLikeSubscribe(input: $input) {
 *     story {
 *       likers { count }
 *       likeSentence { text }
 *     }
 *   }
 * }
 * ```
 */
const SUBSCRIPTION = compose(operation('subscription', {
  __operationName: 'StoryLikeSubscription',
  __variables: {
    input: variable({
      storyId: 'alsdjasldj',
      clientSubscriptionId: 'odejoinklaj',    
    }, 'StoryLikeSubscribeInput', false)
  },
  storyLikeSubscribe: {
    __args:{
      input: fromVariable('input'),
    },
    story: {
      likers: {
        __scalars: ['count']
      },
      likeSentence: {
        __scalars: ['text']
      }
    }
  },
}));

export { QUERY, MUTATION, SUBSCRIPTION };