// Adicionar ao final do arquivo index.js, antes do health check

// Sistema de Lista de Espera
app.post('/waitlist/add', async (req, res) => {
  try {
    const { phoneNumber, name, reason } = req.body;
    
    if (!phoneNumber) {
      return res.status(400).json({ 
        success: false, 
        message: 'Número de telefone é obrigatório' 
      });
    }

    const formattedPhone = formatPhoneNumber(phoneNumber);

    // Verificar se já está na lista de espera
    const existing = await dbQuery(
      'SELECT * FROM waitlist WHERE phone_number = ?',
      [formattedPhone]
    );

    if (existing.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Este número já está na lista de espera' 
      });
    }

    // Adicionar à lista de espera
    await dbRun(
      'INSERT INTO waitlist (phone_number, name, reason, created_at) VALUES (?, ?, ?, datetime("now"))',
      [formattedPhone, name || null, reason || null]
    );

    res.json({
      success: true,
      message: 'Adicionado à lista de espera com sucesso',
      position: await getWaitlistPosition(formattedPhone)
    });

  } catch (error) {
    console.error('Erro ao adicionar à lista de espera:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor' 
    });
  }
});

app.get('/waitlist/position/:phoneNumber', async (req, res) => {
  try {
    const { phoneNumber } = req.params;
    const formattedPhone = formatPhoneNumber(phoneNumber);

    const position = await getWaitlistPosition(formattedPhone);

    if (position === -1) {
      return res.status(404).json({ 
        success: false, 
        message: 'Número não encontrado na lista de espera' 
      });
    }

    res.json({
      success: true,
      position,
      total: await getWaitlistTotal()
    });

  } catch (error) {
    console.error('Erro ao obter posição na lista:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor' 
    });
  }
});

app.get('/waitlist/stats', authenticateToken, async (req, res) => {
  try {
    const total = await getWaitlistTotal();
    const recent = await dbQuery(
      'SELECT * FROM waitlist ORDER BY created_at DESC LIMIT 10'
    );

    res.json({
      success: true,
      total,
      recent: recent.map(item => ({
        phoneNumber: item.phone_number,
        name: item.name,
        reason: item.reason,
        createdAt: item.created_at
      }))
    });

  } catch (error) {
    console.error('Erro ao obter estatísticas da lista:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor' 
    });
  }
});

// Funções auxiliares para lista de espera
const getWaitlistPosition = async (phoneNumber) => {
  const result = await dbQuery(
    'SELECT COUNT(*) as position FROM waitlist WHERE created_at < (SELECT created_at FROM waitlist WHERE phone_number = ?)',
    [phoneNumber]
  );
  return result[0]?.position || -1;
};

const getWaitlistTotal = async () => {
  const result = await dbQuery('SELECT COUNT(*) as total FROM waitlist');
  return result[0]?.total || 0;
};

// Sistema de Convites Melhorado
app.get('/invites/my-codes', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    const codes = await dbQuery(
      'SELECT * FROM invite_codes WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );

    res.json({
      success: true,
      codes: codes.map(code => ({
        id: code.id,
        code: code.code,
        isActive: code.is_active,
        usedBy: code.used_by,
        createdAt: code.created_at,
        expiresAt: code.expires_at,
        usedAt: code.used_at
      }))
    });

  } catch (error) {
    console.error('Erro ao obter códigos de convite:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor' 
    });
  }
});

app.post('/invites/revoke', authenticateToken, async (req, res) => {
  try {
    const { inviteCodeId } = req.body;
    const userId = req.user.userId;

    if (!inviteCodeId) {
      return res.status(400).json({ 
        success: false, 
        message: 'ID do código de convite é obrigatório' 
      });
    }

    // Verificar se o código pertence ao usuário
    const codes = await dbQuery(
      'SELECT * FROM invite_codes WHERE id = ? AND user_id = ?',
      [inviteCodeId, userId]
    );

    if (codes.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Código de convite não encontrado' 
      });
    }

    // Revogar código
    await dbRun(
      'UPDATE invite_codes SET is_active = 0 WHERE id = ?',
      [inviteCodeId]
    );

    res.json({
      success: true,
      message: 'Código de convite revogado com sucesso'
    });

  } catch (error) {
    console.error('Erro ao revogar código de convite:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor' 
    });
  }
});

// Estatísticas de convites
app.get('/invites/stats', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    const stats = await dbQuery(`
      SELECT 
        COUNT(*) as total_codes,
        SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active_codes,
        SUM(CASE WHEN used_by IS NOT NULL THEN 1 ELSE 0 END) as used_codes
      FROM invite_codes 
      WHERE user_id = ?
    `, [userId]);

    const invitedUsers = await dbQuery(`
      SELECT u.name, u.phone_number, ic.created_at as invited_at
      FROM users u
      JOIN invite_codes ic ON u.inviter_id = ic.user_id
      WHERE ic.user_id = ?
      ORDER BY ic.created_at DESC
    `, [userId]);

    res.json({
      success: true,
      stats: stats[0],
      invitedUsers: invitedUsers.map(user => ({
        name: user.name,
        phoneNumber: user.phone_number,
        invitedAt: user.invited_at
      }))
    });

  } catch (error) {
    console.error('Erro ao obter estatísticas de convites:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor' 
    });
  }
});

