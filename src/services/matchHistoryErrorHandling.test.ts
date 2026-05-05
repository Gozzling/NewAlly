/**
 * Test utilities for MatchHistory error handling
 *
 * This file provides utilities to test various error scenarios
 * in the MatchHistory component.
 */

import {
  NetworkError,
  RateLimitError,
  InvalidPlayerError,
  NoMatchHistoryError,
  ServiceUnavailableError,
  MatchHistoryError,
  getUserFriendlyErrorMessage,
  getErrorActionText,
  isRetryableError,
} from './matchHistoryService'

/**
 * Simulate different error scenarios for testing
 */
export function simulateNetworkError(): NetworkError {
  return new NetworkError('Unable to connect to Riot servers. Please check your internet connection.')
}

export function simulateRateLimitError(): RateLimitError {
  return new RateLimitError('Rate limit exceeded. Please wait a moment before trying again.', 5)
}

export function simulateInvalidPlayerError(): InvalidPlayerError {
  return new InvalidPlayerError('Player not found. Please check the summoner name and region.')
}

export function simulateNoMatchHistoryError(): NoMatchHistoryError {
  return new NoMatchHistoryError('No match history found for this player')
}

export function simulateServiceUnavailableError(): ServiceUnavailableError {
  return new ServiceUnavailableError('Riot servers are temporarily unavailable. Please try again later.')
}

export function simulateGenericError(): MatchHistoryError {
  return new MatchHistoryError('An unknown error occurred', 'UNKNOWN_ERROR', true)
}

/**
 * Test error message generation
 */
export function testErrorMessages(): void {
  console.log('Testing error messages:')

  const errors = [
    simulateNetworkError(),
    simulateRateLimitError(),
    simulateInvalidPlayerError(),
    simulateNoMatchHistoryError(),
    simulateServiceUnavailableError(),
    simulateGenericError(),
  ]

  errors.forEach(error => {
    console.log(`\n${error.name}:`)
    console.log(`  Message: ${getUserFriendlyErrorMessage(error)}`)
    console.log(`  Action: ${getErrorActionText(error)}`)
    console.log(`  Retryable: ${isRetryableError(error)}`)
  })
}

/**
 * Test error state creation
 */
export interface TestErrorState {
  message: string
  action: string
  retryable: boolean
  isOffline: boolean
  hasCachedData: boolean
}

export function createTestErrorState(error: Error, isOffline: boolean = false, hasCachedData: boolean = false): TestErrorState {
  return {
    message: getUserFriendlyErrorMessage(error),
    action: getErrorActionText(error),
    retryable: isRetryableError(error),
    isOffline,
    hasCachedData,
  }
}

/**
 * Test scenarios
 */
export const testScenarios = [
  {
    name: 'Network Error - Online - No Cache',
    error: simulateNetworkError(),
    isOffline: true,
    hasCachedData: false,
  },
  {
    name: 'Network Error - Online - Has Cache',
    error: simulateNetworkError(),
    isOffline: true,
    hasCachedData: true,
  },
  {
    name: 'Rate Limit Error',
    error: simulateRateLimitError(),
    isOffline: false,
    hasCachedData: true,
  },
  {
    name: 'Invalid Player Error',
    error: simulateInvalidPlayerError(),
    isOffline: false,
    hasCachedData: false,
  },
  {
    name: 'No Match History Error',
    error: simulateNoMatchHistoryError(),
    isOffline: false,
    hasCachedData: false,
  },
  {
    name: 'Service Unavailable Error',
    error: simulateServiceUnavailableError(),
    isOffline: false,
    hasCachedData: true,
  },
]

/**
 * Run all test scenarios
 */
export function runTestScenarios(): void {
  console.log('Running test scenarios:\n')

  testScenarios.forEach((scenario, index) => {
    console.log(`${index + 1}. ${scenario.name}`)
    const state = createTestErrorState(scenario.error, scenario.isOffline, scenario.hasCachedData)
    console.log(`   Message: ${state.message}`)
    console.log(`   Action: ${state.action}`)
    console.log(`   Retryable: ${state.retryable}`)
    console.log(`   Offline: ${state.isOffline}`)
    console.log(`   Has Cache: ${state.hasCachedData}`)
    console.log('')
  })
}

/**
 * Test retry logic
 */
export async function testRetryLogic(): Promise<void> {
  console.log('Testing retry logic:')

  let attemptCount = 0
  const maxAttempts = 3

  const retryWithBackoff = async (): Promise<string> => {
    attemptCount++
    console.log(`  Attempt ${attemptCount}/${maxAttempts}`)

    if (attemptCount < maxAttempts) {
      throw new NetworkError('Simulated network error')
    }

    return 'Success!'
  }

  try {
    await retryWithBackoff()
    console.log('  Retry logic would be implemented here')
    console.log('  Expected behavior: 3 attempts with exponential backoff')
  } catch (error) {
    console.log('  Error after all retries:', error)
  }
}

/**
 * Run all tests
 */
export function runAllTests(): void {
  console.log('=== MatchHistory Error Handling Tests ===\n')

  testErrorMessages()
  console.log('\n' + '='.repeat(50) + '\n')

  runTestScenarios()
  console.log('\n' + '='.repeat(50) + '\n')

  testRetryLogic()
  console.log('\n' + '='.repeat(50) + '\n')

  console.log('All tests completed!')
}

// Export for use in test files
export default {
  simulateNetworkError,
  simulateRateLimitError,
  simulateInvalidPlayerError,
  simulateNoMatchHistoryError,
  simulateServiceUnavailableError,
  simulateGenericError,
  testErrorMessages,
  createTestErrorState,
  testScenarios,
  runTestScenarios,
  testRetryLogic,
  runAllTests,
}
