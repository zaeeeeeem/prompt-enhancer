/**
 * Test to demonstrate markdown sanitization
 * Shows before/after comparison of enhanced prompts
 */

const BASE_URL = 'http://localhost:3000';

async function testMarkdownSanitization() {
  console.log('\n' + '='.repeat(70));
  console.log('  MARKDOWN SANITIZATION TEST');
  console.log('='.repeat(70) + '\n');

  const testPrompt = 'make a website for me';

  try {
    console.log('📝 Original Prompt:');
    console.log('  "' + testPrompt + '"');
    console.log('');

    console.log('⏳ Sending to API...');
    const response = await fetch(`${BASE_URL}/enhance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ originalPrompt: testPrompt })
    });

    const data = await response.json();

    if (response.ok) {
      console.log('✅ Success!\n');

      // Show the cleaned response
      console.log('✨ ENHANCED PROMPT (Markdown Cleaned):');
      console.log('-'.repeat(70));
      console.log(data.enhancedPrompt);
      console.log('-'.repeat(70));
      console.log('');

      // Show statistics
      console.log('📊 Statistics:');
      console.log(`  • Original Length:  ${testPrompt.length} chars`);
      console.log(`  • Enhanced Length:  ${data.enhancedPrompt.length} chars`);
      console.log(`  • Expansion Factor: ${(data.enhancedPrompt.length / testPrompt.length).toFixed(2)}x`);
      console.log(`  • Tokens Used:      ${data.usage.totalTokens}`);
      console.log(`  • Processing Time:  ${data.latencyMs}ms`);
      console.log('');

      // Check for markdown artifacts
      const hasMarkdown = {
        bold: /\*\*/.test(data.enhancedPrompt),
        italics: /(?<!\*)\*(?!\*)/.test(data.enhancedPrompt),
        code: /`/.test(data.enhancedPrompt),
        headers: /^#+\s/.test(data.enhancedPrompt),
        links: /\[.*?\]\(.*?\)/.test(data.enhancedPrompt),
      };

      console.log('🔍 Markdown Artifact Check:');
      console.log(`  • Bold (**):       ${hasMarkdown.bold ? '❌ Found' : '✅ Cleaned'}`);
      console.log(`  • Italics (*):     ${hasMarkdown.italics ? '❌ Found' : '✅ Cleaned'}`);
      console.log(`  • Code (\`):        ${hasMarkdown.code ? '❌ Found' : '✅ Cleaned'}`);
      console.log(`  • Headers (#):     ${hasMarkdown.headers ? '❌ Found' : '✅ Cleaned'}`);
      console.log(`  • Links [](url):   ${hasMarkdown.links ? '❌ Found' : '✅ Cleaned'}`);
      console.log('');

      const totalArtifacts = Object.values(hasMarkdown).filter(v => v).length;
      if (totalArtifacts === 0) {
        console.log('✅ SUCCESS: All markdown formatting removed!');
      } else {
        console.log(`⚠️  WARNING: ${totalArtifacts} markdown artifact(s) still present`);
      }

    } else {
      console.log('❌ Error:', data.message);
    }

  } catch (error) {
    console.log('❌ Failed:', error.message);
  }

  console.log('\n' + '='.repeat(70));
  console.log('  Test Complete');
  console.log('='.repeat(70) + '\n');
}

// Run test
testMarkdownSanitization().catch(console.error);
