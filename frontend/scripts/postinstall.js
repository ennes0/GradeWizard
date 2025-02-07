const fs = require('fs');
const path = require('path');

try {
  const expoCliPath = path.join(process.cwd(), 'node_modules', '.bin', 'expo');
  
  if (process.platform === 'win32') {
    // Windows için izinleri ayarla
    fs.chmodSync(expoCliPath + '.cmd', '755');
    fs.chmodSync(expoCliPath + '.ps1', '755');
  } else {
    // Unix sistemleri için
    fs.chmodSync(expoCliPath, '755');
  }
  
  console.log('Successfully set permissions for expo CLI');
} catch (error) {
  console.warn('Warning: Could not set permissions for expo CLI:', error.message);
  // Hata olsa bile process'i başarılı say
  process.exit(0);
}
