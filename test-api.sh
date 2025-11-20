#!/bin/bash

# Quick API Test Script
# Tests the PromptEnhance Backend endpoints

echo "========================================"
echo "  PromptEnhance Backend API Test"
echo "========================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

BASE_URL="http://localhost:3000"

echo "Testing server at: $BASE_URL"
echo ""

# Test 1: Root endpoint
echo "1. Testing GET / (API Info)..."
response=$(curl -s -w "\n%{http_code}" "$BASE_URL/")
http_code=$(echo "$response" | tail -n 1)
body=$(echo "$response" | head -n -1)

if [ "$http_code" = "200" ]; then
    echo -e "${GREEN}✓ Success${NC} - Status: $http_code"
    echo "$body" | python3 -m json.tool 2>/dev/null || echo "$body"
else
    echo -e "${RED}✗ Failed${NC} - Status: $http_code"
    echo "$body"
fi
echo ""

# Test 2: Health check
echo "2. Testing GET /health (Health Check)..."
response=$(curl -s -w "\n%{http_code}" "$BASE_URL/health")
http_code=$(echo "$response" | tail -n 1)
body=$(echo "$response" | head -n -1)

if [ "$http_code" = "200" ]; then
    echo -e "${GREEN}✓ Success${NC} - Status: $http_code"
    echo "$body" | python3 -m json.tool 2>/dev/null || echo "$body"
else
    echo -e "${RED}✗ Failed${NC} - Status: $http_code"
    echo "$body"
fi
echo ""

# Test 3: Enhance endpoint
echo "3. Testing POST /enhance (Prompt Enhancement)..."
response=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/enhance" \
  -H "Content-Type: application/json" \
  -d '{"originalPrompt": "make a website for me"}')
http_code=$(echo "$response" | tail -n 1)
body=$(echo "$response" | head -n -1)

if [ "$http_code" = "200" ]; then
    echo -e "${GREEN}✓ Success${NC} - Status: $http_code"
    echo "$body" | python3 -m json.tool 2>/dev/null || echo "$body"
else
    echo -e "${RED}✗ Failed${NC} - Status: $http_code"
    echo "$body"
fi
echo ""

# Test 4: Invalid request (missing originalPrompt)
echo "4. Testing POST /enhance (Invalid Request - should return 400)..."
response=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/enhance" \
  -H "Content-Type: application/json" \
  -d '{}')
http_code=$(echo "$response" | tail -n 1)
body=$(echo "$response" | head -n -1)

if [ "$http_code" = "400" ]; then
    echo -e "${GREEN}✓ Success${NC} - Correctly rejected invalid request"
    echo "$body" | python3 -m json.tool 2>/dev/null || echo "$body"
else
    echo -e "${YELLOW}! Unexpected${NC} - Status: $http_code (expected 400)"
    echo "$body"
fi
echo ""

# Test 5: Wrong content type
echo "5. Testing POST /enhance (Wrong Content-Type - should return 415)..."
response=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/enhance" \
  -H "Content-Type: text/plain" \
  -d 'make a website')
http_code=$(echo "$response" | tail -n 1)
body=$(echo "$response" | head -n -1)

if [ "$http_code" = "415" ]; then
    echo -e "${GREEN}✓ Success${NC} - Correctly rejected wrong content type"
    echo "$body" | python3 -m json.tool 2>/dev/null || echo "$body"
else
    echo -e "${YELLOW}! Unexpected${NC} - Status: $http_code (expected 415)"
    echo "$body"
fi
echo ""

echo "========================================"
echo "  Test Complete!"
echo "========================================"
