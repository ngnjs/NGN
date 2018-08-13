/**
 * NGN.DATA.DateField
 * Dates are complex, and while JavaScript supports a date object, it does not
 * contain a date primitive. The date field can be used to define a date and
 * respond to many nuances within the context of data management.
 *
 * This should not be used for traditional date manipulation. If you merely
 * want to manage a single date, please use NGNX.DateTime instead.
 */
export default class NGNDateField extends NGNDataField { // eslint-disable-line
  constructor (cfg = {}) {
    cfg.type = Date

    super(cfg)
  }
}
