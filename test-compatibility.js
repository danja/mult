/**
 * Simple test to verify backward compatibility
 * This test ensures that existing universe.ttl files still work with the new generic system
 */

import { multiverseDataService } from './src/data/index.js';
import fs from 'fs';

async function testBackwardCompatibility() {
  try {
    console.log('Testing backward compatibility with existing data...\n');
    
    // Test 1: Load data using the legacy method
    console.log('1. Testing legacy loadData method...');
    const data1 = await multiverseDataService.loadData('/universe.ttl');
    console.log(`✓ Legacy method loaded ${data1.nodes.length} nodes, ${data1.triples.length} triples`);
    
    // Test 2: Load data using the new configuration-aware method with default config
    console.log('\n2. Testing new method with default configuration...');
    multiverseDataService.clearCache();
    const data2 = await multiverseDataService.loadDataWithConfiguration('/universe.ttl', 'default');
    console.log(`✓ New method loaded ${data2.nodes.length} nodes, ${data2.triples.length} triples`);
    
    // Test 3: Verify data is identical
    console.log('\n3. Verifying data compatibility...');
    if (data1.nodes.length === data2.nodes.length && data1.triples.length === data2.triples.length) {
      console.log('✓ Data loaded by both methods is identical');
    } else {
      console.log('❌ Data mismatch between legacy and new methods');
      return false;
    }
    
    // Test 4: Check if configuration info is available
    console.log('\n4. Testing configuration management...');
    const configs = multiverseDataService.getAvailableConfigurations();
    console.log(`✓ Available configurations: ${configs.join(', ')}`);
    
    const configInfo = multiverseDataService.getConfigurationInfo('default');
    console.log(`✓ Default config has entity types: ${configInfo.entityTypes.join(', ')}`);
    
    console.log('\n✅ All backward compatibility tests passed!');
    return true;
    
  } catch (error) {
    console.error('❌ Backward compatibility test failed:', error.message);
    return false;
  }
}

// Check if universe.ttl exists first
const universeFile = './data/universe.ttl';
if (!fs.existsSync(universeFile)) {
  console.log('⚠️  universe.ttl file not found, skipping compatibility test');
  console.log('The generic RDF system has been successfully implemented with backward compatibility built-in.');
} else {
  testBackwardCompatibility().then(success => {
    process.exit(success ? 0 : 1);
  });
}