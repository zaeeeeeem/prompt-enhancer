/**
 * Simple JavaScript test for PromptEnhance Backend
 * Run with: node test-simple.js
 */

const BASE_URL = 'http://localhost:3000';

// Test function
async function testAPI() {
  console.log('\n========================================');
  console.log('  PromptEnhance Backend API Test');
  console.log('========================================\n');

  // Test 1: Health Check
  console.log('1. Testing Health Check...');
  try {
    const response = await fetch(`${BASE_URL}/health`);
    const data = await response.json();
    console.log('✓ Success:', data);
  } catch (error) {
    console.log('✗ Failed:', error.message);
  }
  console.log('');

  // Test 2: Enhance Prompt
  console.log('2. Testing Prompt Enhancement...');
  try {
    const response = await fetch(`${BASE_URL}/enhance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        originalPrompt: 'make a website for me'
      })
    });

    const data = await response.json();

    if (response.ok) {
      console.log('✓ Success!');
      console.log('  Enhanced Prompt:', data.enhancedPrompt.substring(0, 100) + '...');
      console.log('  Tokens Used:', data.usage.totalTokens);
      console.log('  Latency:', data.latencyMs + 'ms');
    } else {
      console.log('✗ Failed:', data.message);
    }
  } catch (error) {
    console.log('✗ Failed:', error.message);
  }
  console.log('');

  // Test 3: Invalid Request
  console.log('3. Testing Invalid Request (should fail)...');
  try {
    const response = await fetch(`${BASE_URL}/enhance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });

    const data = await response.json();

    if (response.status === 400) {
      console.log('✓ Correctly rejected:', data.message);
    } else {
      console.log('✗ Unexpected status:', response.status);
    }
  } catch (error) {
    console.log('✗ Failed:', error.message);
  }
  console.log('');

  console.log('========================================');
  console.log('  Test Complete!');
  console.log('========================================\n');
}

// Run tests
testAPI().catch(console.error);
