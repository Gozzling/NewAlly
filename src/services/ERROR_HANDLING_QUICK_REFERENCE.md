# Error Handling Quick Reference

## Common Error Handling Patterns

### 1. Basic Error Handling

```typescript
import {
  fetchPlayerMatchHistory,
  getUserFriendlyErrorMessage,
  isRetryableError
} from '@/services/matchHistoryService'

try {
  const matches = await fetchPlayerMatchHistory(puuid, region, 20, 0)
  // Handle success
} catch (error) {
  const message = getUserFriendlyErrorMessage(error)
  const canRetry = isRetryableError(error)

  // Show error to user
  showError(message)

  // Show retry button if retryable
  if (canRetry) {
    showRetryButton()
  }
}
```

### 2. Retry with Custom Config

```typescript
import { retryWithBackoff } from '@/services/matchHistoryService'

const customConfig = {
  maxRetries: 5,
  initialDelay: 2000,
  maxDelay: 30000,
  backoffMultiplier: 2,
}

try {
  const result = await retryWithBackoff(
    () => someAsyncFunction(),
    customConfig,
    console.log
  )
} catch (error) {
  // Handle final error after all retries
}
```

### 3. Offline Mode

```typescript
import {
  isOnline,
  getCachedMatchHistory,
  hasCachedMatchHistory
} from '@/services/matchHistoryService'

if (!isOnline()) {
  // We're offline
  if (hasCachedMatchHistory(puuid, region)) {
    // Load cached data
    const cached = getCachedMatchHistory(puuid, region, 20, 0)
    // Display cached data
  } else {
    // Show offline message
    showOfflineMessage()
  }
} else {
  // We're online, fetch fresh data
  const fresh = await fetchPlayerMatchHistory(puuid, region)
}
```

### 4. Custom Error Types

```typescript
import {
  NetworkError,
  RateLimitError,
  InvalidPlayerError,
  NoMatchHistoryError,
  ServiceUnavailableError
} from '@/services/matchHistoryService'

// Throw specific errors
if (!navigator.onLine) {
  throw new NetworkError('No internet connection')
}

if (response.status === 429) {
  throw new RateLimitError('Rate limited', response.headers['retry-after'])
}

if (response.status === 404) {
  throw new InvalidPlayerError('Player not found')
}

if (response.status === 503) {
  throw new ServiceUnavailableError('Service unavailable')
}
```

### 5. Error State Management

```typescript
interface ErrorState {
  message: string
  action: string
  retryable: boolean
  isOffline: boolean
  hasCachedData: boolean
}

function handleError(error: Error): ErrorState {
  return {
    message: getUserFriendlyErrorMessage(error),
    action: getErrorActionText(error),
    retryable: isRetryableError(error),
    isOffline: !isOnline(),
    hasCachedData: hasCachedMatchHistory(puuid, region),
  }
}
```

## Error Type Reference

| Error Type | When to Use | Retryable | User Message |
|------------|-------------|-----------|---------------|
| `NetworkError` | Connection issues | Yes | "Unable to connect to Riot servers" |
| `RateLimitError` | API rate limit | Yes | "Rate limit exceeded" |
| `InvalidPlayerError` | Player not found | No | "Player not found" |
| `NoMatchHistoryError` | No matches | No | "No match history found" |
| `ServiceUnavailableError` | 503 errors | Yes | "Riot servers temporarily unavailable" |

## Utility Functions

### `getUserFriendlyErrorMessage(error: Error): string`

Converts any error to a user-friendly message.

```typescript
const message = getUserFriendlyErrorMessage(error)
// "Unable to connect to Riot servers. Please check your internet connection."
```

### `getErrorActionText(error: Error): string`

Provides actionable next steps.

```typescript
const action = getErrorActionText(error)
// "Check your internet connection and try again"
```

### `isRetryableError(error: Error): boolean`

Determines if an error can be retried.

```typescript
if (isRetryableError(error)) {
  await retry()
}
```

### `isOnline(): boolean`

Checks if browser is online.

```typescript
if (isOnline()) {
  // Fetch fresh data
} else {
  // Load cached data
}
```

### `getCachedMatchHistory(puuid, region, count, offset): Match[] | null`

Gets cached match history.

```typescript
const cached = getCachedMatchHistory(puuid, region, 20, 0)
if (cached) {
  // Display cached data
}
```

### `hasCachedMatchHistory(puuid, region): boolean`

Checks if cached data exists.

```typescript
if (hasCachedMatchHistory(puuid, region)) {
  // Can show cached data
}
```

## Component Integration

### React Component Example

```typescript
import { useState, useEffect } from 'react'
import {
  fetchPlayerMatchHistory,
  getUserFriendlyErrorMessage,
  isRetryableError,
  isOnline,
  getCachedMatchHistory
} from '@/services/matchHistoryService'

function MyComponent() {
  const [matches, setMatches] = useState([])
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isRetrying, setIsRetrying] = useState(false)

  const loadMatches = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await fetchPlayerMatchHistory(puuid, region)
      setMatches(data)
    } catch (err) {
      setError({
        message: getUserFriendlyErrorMessage(err),
        retryable: isRetryableError(err),
        isOffline: !isOnline(),
      })
    } finally {
      setLoading(false)
    }
  }

  const handleRetry = async () => {
    setIsRetrying(true)
    await loadMatches()
    setIsRetrying(false)
  }

  const loadCached = () => {
    const cached = getCachedMatchHistory(puuid, region)
    if (cached) {
      setMatches(cached)
      setError(null)
    }
  }

  useEffect(() => {
    loadMatches()
  }, [])

  if (loading) return <LoadingSpinner />
  if (error) {
    return (
      <ErrorDisplay
        message={error.message}
        retryable={error.retryable}
        onRetry={handleRetry}
        onLoadCached={loadCached}
        isRetrying={isRetrying}
      />
    )
  }

  return <MatchList matches={matches} />
}
```

## Testing

### Simulating Errors

```typescript
import {
  simulateNetworkError,
  simulateRateLimitError,
  simulateInvalidPlayerError
} from './matchHistoryErrorHandling.test'

// Test network error handling
const networkError = simulateNetworkError()
console.log(getUserFriendlyErrorMessage(networkError))

// Test rate limit error handling
const rateLimitError = simulateRateLimitError()
console.log(getErrorActionText(rateLimitError))
```

### Running Tests

```typescript
import { runAllTests } from './matchHistoryErrorHandling.test'

// Run all error handling tests
runAllTests()
```

## Debugging

### Enable Debug Logging

```typescript
const log = (msg: string) => console.log(`[DEBUG] ${msg}`)

const matches = await fetchPlayerMatchHistory(
  puuid,
  region,
  20,
  0,
  log  // Pass log function for debugging
)
```

### Check Error Details

```typescript
try {
  await someOperation()
} catch (error) {
  if (error instanceof MatchHistoryError) {
    console.log('Error code:', error.code)
    console.log('Retryable:', error.retryable)
    console.log('Original error:', error.originalError)
  }
}
```

## Best Practices

1. **Always handle errors**: Never let errors propagate to the user
2. **Use specific error types**: Helps with error handling logic
3. **Provide retry options**: For retryable errors
4. **Show cached data**: When offline
5. **Log errors**: For debugging and monitoring
6. **Test error scenarios**: Use test utilities
7. **Monitor online status**: Provide offline support
8. **Validate cache**: Before using cached data

## Common Issues

### Issue: "Error: undefined"

**Solution**: Check if error is an Error instance before handling:

```typescript
if (error instanceof Error) {
  // Handle error
} else {
  // Handle non-error throw
}
```

### Issue: Retry not working

**Solution**: Check if error is retryable:

```typescript
if (isRetryableError(error)) {
  await retry()
} else {
  // Don't retry
}
```

### Issue: Cached data not loading

**Solution**: Check if cache exists and is valid:

```typescript
const cached = getCachedMatchHistory(puuid, region)
if (cached && cached.length > 0) {
  // Use cached data
} else {
  // Show error
}
```

## Additional Resources

- [Full Documentation](./MATCH_HISTORY_ERROR_HANDLING.md)
- [Test Utilities](./matchHistoryErrorHandling.test.ts)
- [Service Implementation](./matchHistoryService.ts)
- [Component Implementation](../pages/MatchHistory.tsx)
