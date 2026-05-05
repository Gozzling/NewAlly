# MatchHistory Error Handling Documentation

## Overview

This document describes the comprehensive error handling implementation for the MatchHistory component in TFTAlly. The system provides robust error handling with retry logic, offline mode support, and user-friendly error messages.

## Architecture

### Error Types

The error handling system uses a hierarchy of custom error types:

```typescript
MatchHistoryError (base class)
├── NetworkError
├── RateLimitError
├── InvalidPlayerError
├── NoMatchHistoryError
└── ServiceUnavailableError
```

Each error type includes:
- `message`: User-friendly error description
- `code`: Error code for programmatic handling
- `retryable`: Boolean indicating if the operation can be retried
- `originalError`: The original error (if applicable)

### Service Layer (`matchHistoryService.ts`)

#### Key Functions

1. **`fetchPlayerMatchHistory()`**
   - Main function for fetching match history
   - Supports retry logic with exponential backoff
   - Handles offline mode
   - Provides caching

2. **`retryWithBackoff()`**
   - Implements exponential backoff retry logic
   - Configurable retry parameters
   - Respects rate limit headers

3. **`getCachedMatchHistory()`**
   - Retrieves cached match data
   - Validates cache integrity
   - Returns null if no valid cache exists

4. **`hasCachedMatchHistory()`**
   - Checks if cached data exists for a player
   - Used for offline mode determination

5. **`isOnline()`**
   - Checks browser online status
   - Monitors network connectivity

6. **`getUserFriendlyErrorMessage()`**
   - Converts errors to user-friendly messages
   - Handles all error types

7. **`getErrorActionText()`**
   - Provides actionable next steps
   - Context-aware suggestions

8. **`isRetryableError()`**
   - Determines if an error can be retried
   - Prevents unnecessary retries

### Component Layer (`MatchHistory.tsx`)

#### State Management

```typescript
interface ErrorState {
  message: string
  action: string
  retryable: boolean
  isOffline: boolean
  hasCachedData: boolean
}
```

#### Key Features

1. **Online/Offline Status Monitoring**
   - Real-time network status updates
   - Visual indicator in header
   - Automatic offline mode detection

2. **Retry Functionality**
   - Manual retry button
   - Automatic retry with exponential backoff
   - Retry count tracking

3. **Cached Data Display**
   - Shows cached data when offline
   - Clear "CACHED DATA" indicator
   - Graceful degradation

4. **Error Display**
   - User-friendly error messages
   - Actionable next steps
   - Context-aware UI

## Error Scenarios

### 1. Network Error

**Cause**: Lost internet connection, DNS failure, etc.

**Behavior**:
- Shows offline indicator
- Attempts to load cached data
- Provides retry button
- Suggests checking internet connection

**User Message**: "Unable to connect to Riot servers. Please check your internet connection."

**Action**: "Check your internet connection and try again"

**Retryable**: Yes

### 2. Rate Limit Error

**Cause**: Too many API requests

**Behavior**:
- Shows rate limit message
- Waits before retry (respects retry-after)
- Provides retry button
- Suggestes waiting

**User Message**: "Rate limit exceeded. Please wait a moment before trying again."

**Action**: "Please wait a moment before trying again"

**Retryable**: Yes

### 3. Invalid Player Error

**Cause**: Summoner name not found, wrong region

**Behavior**:
- Shows player not found message
- No retry option (non-retryable)
- Suggests checking name/region

**User Message**: "Player not found. Please check the summoner name and region."

**Action**: "Please check the summoner name and region"

**Retryable**: No

### 4. No Match History Error

**Cause**: Player has no matches

**Behavior**:
- Shows empty state
- No retry option (non-retryable)
- Suggests player has no history

**User Message**: "No match history found for this player"

**Action**: "This player has no match history yet"

**Retryable**: No

### 5. Service Unavailable Error

**Cause**: Riot API down (503)

**Behavior**:
- Shows service unavailable message
- Attempts to load cached data
- Provides retry button
- Suggestes trying later

**User Message**: "Riot servers are temporarily unavailable. Please try again later."

**Action**: "Riot servers are temporarily unavailable"

**Retryable**: Yes

## Retry Logic

### Configuration

```typescript
const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelay: 1000,    // 1 second
  maxDelay: 10000,       // 10 seconds
  backoffMultiplier: 2,  // Exponential backoff
}
```

### Retry Behavior

1. **First Attempt**: Immediate
2. **Second Attempt**: 1 second delay
3. **Third Attempt**: 2 seconds delay
4. **Fourth Attempt**: 4 seconds delay (maxed at 10 seconds)

### Rate Limit Handling

If a rate limit error includes a `retry-after` header:
- Uses the specified delay instead of exponential backoff
- Waits the exact time requested by the server

## Offline Mode

### Detection

- Monitors `window.addEventListener('online')` and `window.addEventListener('offline')`
- Checks `navigator.onLine` status
- Updates UI in real-time

### Behavior

1. **When Offline**:
   - Shows offline indicator
   - Attempts to load cached data
   - Disables features requiring internet
   - Provides clear messaging

2. **When Online**:
   - Shows online indicator
   - Attempts to fetch fresh data
   - Updates cache with new data
   - Clears offline state

### Cached Data

- Stored in localStorage with 24-hour expiration
- Validated before use
- Shows "CACHED DATA" indicator
- Cannot load more pages from cache

## User Experience

### Loading States

1. **Initial Load**: Shows skeleton rows
2. **Loading More**: Shows "Loading more…" message
3. **Retrying**: Shows spinner with "Retrying..." text
4. **Search**: Shows spinner in search button

### Error States

1. **Error Display**:
   - Error icon
   - Clear error message
   - Actionable next steps
   - Retry button (if retryable)
   - Cached data button (if available)
   - Offline indicator (if offline)

2. **Empty State**:
   - Empty state icon
   - Clear message
   - Context-aware text

### Visual Indicators

1. **Online/Offline Status**:
   - Green dot for online
   - Red pulsing dot for offline
   - Text label

2. **Cached Data**:
   - Yellow "CACHED DATA" badge
   - Shown in chart header

3. **Loading**:
   - Skeleton rows
   - Spinners
   - Progress messages

## Testing

### Test Utilities

See `matchHistoryErrorHandling.test.ts` for:
- Error simulation functions
- Test scenarios
- Retry logic testing
- Error message testing

### Manual Testing

1. **Network Error**:
   - Disconnect internet
   - Try to load match history
   - Verify offline mode activates
   - Verify cached data loads

2. **Rate Limit**:
   - Make rapid requests
   - Verify rate limit message
   - Verify retry behavior

3. **Invalid Player**:
   - Search for non-existent player
   - Verify error message
   - Verify no retry option

4. **Service Unavailable**:
   - Use mock server returning 503
   - Verify error message
   - Verify retry option

## Best Practices

### For Developers

1. **Always use custom error types**:
   ```typescript
   throw new NetworkError('Connection failed')
   ```

2. **Check retryable before retrying**:
   ```typescript
   if (isRetryableError(error)) {
     await retry()
   }
   ```

3. **Provide user-friendly messages**:
   ```typescript
   const message = getUserFriendlyErrorMessage(error)
   ```

4. **Handle offline gracefully**:
   ```typescript
   if (!isOnline()) {
     // Load cached data
   }
   ```

### For Users

1. **Check internet connection** if seeing network errors
2. **Wait a moment** if seeing rate limit errors
3. **Verify summoner name** if seeing invalid player errors
4. **Try again later** if seeing service unavailable errors

## Future Enhancements

1. **Automatic Retry**: Add option for automatic retry on network restoration
2. **Cache Expiration**: Show cache age to users
3. **Error Analytics**: Track error rates for monitoring
4. **Smart Retry**: Use machine learning to optimize retry timing
5. **Offline Queue**: Queue requests for when connection restores

## Support

For issues or questions about error handling:
1. Check this documentation
2. Review test utilities
3. Examine error logs in debug panel
4. Check browser console for detailed errors

## Changelog

### Version 1.0.0 (Current)
- Initial comprehensive error handling
- Retry logic with exponential backoff
- Offline mode support
- User-friendly error messages
- Cached data display
- Online/offline status monitoring
