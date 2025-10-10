const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Configuração do banco de dados
const pool = new Pool({
  connectionString: process.env.POSTGRES_URL || 'postgresql://vo1d:vo1d123@localhost:5432/vo1d',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function setupDatabase() {
  try {
    console.log('Iniciando configuração do banco de dados...');

    // Ler arquivo SQL de criação das tabelas
    const sqlFile = path.join(__dirname, '..', 'schema.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');

    // Executar SQL
    await pool.query(sql);
    console.log('✅ Tabelas criadas com sucesso!');

    // Criar índices para performance
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone_number);',
      'CREATE INDEX IF NOT EXISTS idx_users_inviter ON users(inviter_id);',
      'CREATE INDEX IF NOT EXISTS idx_invite_codes_code ON invite_codes(code);',
      'CREATE INDEX IF NOT EXISTS idx_invite_codes_user ON invite_codes(user_id);',
      'CREATE INDEX IF NOT EXISTS idx_conversations_users ON conversations(user1_id, user2_id);',
      'CREATE INDEX IF NOT EXISTS idx_conversations_last_message ON conversations(last_message_time);'
    ];

    for (const indexQuery of indexes) {
      await pool.query(indexQuery);
    }
    console.log('✅ Índices criados com sucesso!');

    console.log('🎉 Configuração do banco de dados concluída!');
    
  } catch (error) {
    console.error('❌ Erro ao configurar banco de dados:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  setupDatabase();
}

module.exports = { setupDatabase };


