// [PARTIAL]

/**
 * @class NGN.DATA.Store
 * Represents a collection of data.
 * @fires record.create
 * Fired when a new record is created. The new
 * record is provided as an argument to the event
 * handler.
 * @fires record.delete
 * Fired when a record(s) is removed. The old record
 * is provided as an argument to the event handler.
 */
class NGNDataStore extends NGN.EventEmitter {
  constructor (cfg = {}) {
    if (!cfg.model || NGN.typeof(cfg.model) !== 'model') {
      throw new InvalidConfigurationError('Missing or invalid "model" configuration property.')
    }

    super(cfg)

    Object.defineProperties(this, {
      /**
       * @cfgproperty {string} [name]
       * A descriptive name for the store. This is typically used for
       * debugging, logging, and (somtimes) data proxies.
       */
      name: NGN.const(NGN.coalesce(cfg.name, 'Untitled Store')),

      METADATA: NGN.private({
        /**
         * @cfgproperty {NGN.DATA.Model} model
         * An NGN Data Model to which data records conform.
         */
        model: cfg.model,

        /**
         * @cfg {boolean} [audit=false]
         * Enable auditing to support #undo/#redo operations. This creates and
         * manages a NGN.DATA.TransactionLog.
         */
        AUDITABLE: NGN.coalesce(cfg.audit, false),
        AUDITLOG: NGN.coalesce(cfg.audit, false) ? new NGN.DATA.TransactionLog() : null,
        AUDIT_HANDLER: (change) => {
          if (change.hasOwnProperty('cursor')) {
            this.METADATA.AUDITLOG.commit(this.METADATA.getAuditMap())
          }
        }
      })
    })

    console.log('STORE')
  }

  get auditable () {
    return this.METADATA.AUDITABLE
  }

  set auditable (value) {
    value = NGN.forceBoolean(value)

    if (value !== this.METADATA.AUDITABLE) {
      this.METADATA.AUDITABLE = value
      this.METADATA.AUDITLOG = value ? new NGN.DATA.TransactionLog() : null
    }
  }

  get model () {
    return this.METADATA.model
  }

  set model (value) {
    if (value !== this.METADATA.model) {
      if (NGN.typeof(value) !== 'model') {
        throw new InvalidConfigurationError(`"${this.name}" model could not be set because the value is ${NGN.typeof(value)} (requires NGN.DATA.Model).`)
      }

      this.METADATA.model = value
    }
  }
}
