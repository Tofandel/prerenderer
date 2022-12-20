export type Schema = Record<string, {
  type: {name: string} | Array<{name: string}>,
  required: boolean,
  default?: unknown,
  children?: Schema,
}>

export default function validateOptionsSchema (schema: Schema, options: unknown, parent = '') {
  const errors: Array<string> = []

  Object.keys(schema).forEach(key => {
    // Required options
    const option = typeof options === 'object' && key in options ? options[key] as unknown : undefined
    if (schema[key].required && !option) {
      errors.push(`"${parent}${key}" option is required!`)
      return
      // Options with default values or potential children.
    } else if (!option && (schema[key].default || schema[key].children)) {
      options[key] = schema[key].default != null ? schema[key].default : {}
      // Non-required empty options.
    } else if (!option) return

    // Array-type options
    const type = schema[key].type
    if (Array.isArray(type) && (typeof option !== 'object' || type.indexOf(option.constructor) === -1)) {
      errors.push(`"${parent}${key}" option must be a ${type.map(t => t.name).join(' or ')}!`)
      // Single-type options.
    } else if (!Array.isArray(type) && (typeof option !== 'object' || option.constructor !== schema[key].type)) {
      errors.push(`"${parent}${key}" option must be a ${type.name}!`)
      return
    }

    if (schema[key].children) {
      errors.push(...validateOptionsSchema(schema[key].children, option, key))
    }
  })

  return errors
}
