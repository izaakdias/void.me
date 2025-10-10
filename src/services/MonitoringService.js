import AsyncStorage from '@react-native-async-storage/async-storage';
import {Platform} from 'react-native';

class MonitoringService {
  static instance = null;

  static getInstance() {
    if (!MonitoringService.instance) {
      MonitoringService.instance = new MonitoringService();
    }
    return MonitoringService.instance;
  }

  static initialize() {
    const monitoringService = MonitoringService.getInstance();
    monitoringService.setup();
    return monitoringService;
  }

  setup() {
    // Configurar logs básicos
    this.logLevel = 'INFO';
    this.maxLogs = 1000;
    this.logs = [];
    
    // Inicializar métricas
    this.metrics = {
      messagesSent: 0,
      messagesReceived: 0,
      encryptionTime: 0,
      decryptionTime: 0,
      errors: 0,
      crashes: 0,
    };
  }

  // Logging
  log(level, message, data = {}) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      data,
      platform: Platform.OS,
      version: '1.0.0',
    };

    // Adicionar ao array de logs
    this.logs.push(logEntry);

    // Manter apenas os últimos logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Salvar logs no storage
    this.saveLogs();

    // Log no console para desenvolvimento
    if (__DEV__) {
      console.log(`[${level}] ${message}`, data);
    }
  }

  info(message, data = {}) {
    this.log('INFO', message, data);
  }

  warn(message, data = {}) {
    this.log('WARN', message, data);
  }

  error(message, data = {}) {
    this.log('ERROR', message, data);
    this.metrics.errors++;
  }

  debug(message, data = {}) {
    if (__DEV__) {
      this.log('DEBUG', message, data);
    }
  }

  // Métricas
  incrementMetric(metricName, value = 1) {
    if (this.metrics[metricName] !== undefined) {
      this.metrics[metricName] += value;
    }
  }

  setMetric(metricName, value) {
    this.metrics[metricName] = value;
  }

  getMetric(metricName) {
    return this.metrics[metricName];
  }

  getAllMetrics() {
    return {...this.metrics};
  }

  // Performance
  startTimer(label) {
    this.timers = this.timers || {};
    this.timers[label] = Date.now();
  }

  endTimer(label) {
    if (this.timers && this.timers[label]) {
      const duration = Date.now() - this.timers[label];
      this.log('PERF', `Timer ${label}`, {duration});
      delete this.timers[label];
      return duration;
    }
    return 0;
  }

  // Salvar logs no storage
  async saveLogs() {
    try {
      await AsyncStorage.setItem('vo1d_logs', JSON.stringify(this.logs));
    } catch (error) {
      console.error('Erro ao salvar logs:', error);
    }
  }

  // Carregar logs do storage
  async loadLogs() {
    try {
      const logs = await AsyncStorage.getItem('vo1d_logs');
      if (logs) {
        this.logs = JSON.parse(logs);
      }
    } catch (error) {
      console.error('Erro ao carregar logs:', error);
    }
  }

  // Obter logs filtrados
  getLogs(level = null, limit = 100) {
    let filteredLogs = this.logs;
    
    if (level) {
      filteredLogs = this.logs.filter(log => log.level === level);
    }
    
    return filteredLogs.slice(-limit);
  }

  // Limpar logs
  clearLogs() {
    this.logs = [];
    AsyncStorage.removeItem('vo1d_logs');
  }

  // Health Check
  async healthCheck() {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      metrics: this.metrics,
      logs: this.logs.length,
      errors: this.metrics.errors,
      crashes: this.metrics.crashes,
    };

    // Verificar se há muitos erros
    if (this.metrics.errors > 10) {
      health.status = 'warning';
    }

    // Verificar se há crashes
    if (this.metrics.crashes > 0) {
      health.status = 'critical';
    }

    this.log('HEALTH', 'Health check', health);
    return health;
  }

  // Crash Reporting
  reportCrash(error, stackTrace = null) {
    this.metrics.crashes++;
    
    this.error('CRASH', {
      error: error.message,
      stackTrace,
      timestamp: new Date().toISOString(),
      platform: Platform.OS,
    });
  }

  // Network Monitoring
  logNetworkRequest(url, method, status, duration) {
    this.log('NETWORK', `${method} ${url}`, {
      status,
      duration,
      timestamp: new Date().toISOString(),
    });
  }

  // Encryption Monitoring
  logEncryption(operation, duration, success) {
    this.log('ENCRYPTION', `${operation} ${success ? 'success' : 'failed'}`, {
      duration,
      timestamp: new Date().toISOString(),
    });

    if (operation === 'encrypt') {
      this.metrics.encryptionTime += duration;
    } else if (operation === 'decrypt') {
      this.metrics.decryptionTime += duration;
    }
  }

  // Message Monitoring
  logMessage(type, data) {
    this.log('MESSAGE', type, {
      ...data,
      timestamp: new Date().toISOString(),
    });

    if (type === 'sent') {
      this.metrics.messagesSent++;
    } else if (type === 'received') {
      this.metrics.messagesReceived++;
    }
  }

  // User Activity
  logUserActivity(action, data = {}) {
    this.log('USER_ACTIVITY', action, {
      ...data,
      timestamp: new Date().toISOString(),
    });
  }

  // Security Events
  logSecurityEvent(event, data = {}) {
    this.log('SECURITY', event, {
      ...data,
      timestamp: new Date().toISOString(),
    });
  }

  // Exportar dados para análise
  async exportData() {
    const data = {
      logs: this.logs,
      metrics: this.metrics,
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    };

    return data;
  }

  // Configurar nível de log
  setLogLevel(level) {
    this.logLevel = level;
    this.log('CONFIG', `Log level set to ${level}`);
  }

  // Obter estatísticas
  getStats() {
    const stats = {
      totalLogs: this.logs.length,
      errorLogs: this.logs.filter(log => log.level === 'ERROR').length,
      warningLogs: this.logs.filter(log => log.level === 'WARN').length,
      infoLogs: this.logs.filter(log => log.level === 'INFO').length,
      metrics: this.metrics,
    };

    return stats;
  }
}

export default MonitoringService;

