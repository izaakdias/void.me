const sqlite3 = require('sqlite3').verbose();
const path = require('path');

async function resetTestData() {
  try {
    console.log('🔄 Resetando dados de teste...');

    const dbPath = path.join(__dirname, '..', 'data', 'vo1d.db');
    const db = new sqlite3.Database(dbPath);

    // Gerar novo código de teste
    const newTestCode = 'TEST' + Math.random().toString(36).substring(2, 8).toUpperCase();
    
    console.log(`🎯 Novo código de teste gerado: ${newTestCode}`);

    // Limpar dados de teste anteriores
    await new Promise((resolve, reject) => {
      db.serialize(() => {
        // Deletar usuários de teste
        db.run("DELETE FROM users WHERE phone_number LIKE '+55%' OR phone_number LIKE '+1%'", (err) => {
          if (err) {
            console.error('❌ Erro ao limpar usuários:', err);
            reject(err);
            return;
          }
          console.log('✅ Usuários de teste removidos');
        });

        // Deletar códigos de convite de teste
        db.run("DELETE FROM invite_codes WHERE code LIKE 'ABC%' OR code LIKE 'TEST%'", (err) => {
          if (err) {
            console.error('❌ Erro ao limpar códigos:', err);
            reject(err);
            return;
          }
          console.log('✅ Códigos de teste removidos');
        });

        // Criar usuário admin de teste
        db.run(`
          INSERT INTO users (phone_number, name, needs_invite_code, is_active) 
          VALUES ('+5511999999999', 'Admin Test', 0, 1)
        `, function(err) {
          if (err) {
            console.error('❌ Erro ao criar admin:', err);
            reject(err);
            return;
          }
          const adminId = this.lastID;
          console.log(`✅ Admin criado com ID: ${adminId}`);

          // Criar código de convite de teste
          db.run(`
            INSERT INTO invite_codes (code, user_id, is_active, expires_at) 
            VALUES (?, ?, 1, datetime('now', '+30 days'))
          `, [newTestCode, adminId], (err) => {
            if (err) {
              console.error('❌ Erro ao criar código:', err);
              reject(err);
              return;
            }
            console.log(`✅ Código de convite criado: ${newTestCode}`);
            resolve();
          });
        });
      });
    });

    // Fechar conexão
    db.close((err) => {
      if (err) {
        console.error('❌ Erro ao fechar banco:', err);
        return;
      }
      console.log('🎉 Reset concluído com sucesso!');
      console.log(`\n📱 Use este código para testar: ${newTestCode}`);
      console.log('📞 Use qualquer número de telefone para testar');
    });

  } catch (error) {
    console.error('❌ Erro ao resetar dados:', error);
    process.exit(1);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  resetTestData();
}

module.exports = { resetTestData };
