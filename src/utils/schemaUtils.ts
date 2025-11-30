import Ajv from "ajv"

const ajv = new Ajv({ allErrors: true })

export interface ValidationResult {
    valid: boolean
    errors: string[]
}

export const validateSchema = (schemaStr: string, data: any): ValidationResult => {
    try {
        const schema = JSON.parse(schemaStr)
        const validate = ajv.compile(schema)
        const valid = validate(data)

        if (valid) {
            return { valid: true, errors: [] }
        } else {
            const errorGroups: Record<string, { count: number, message: string, originalPath: string, maskedPath: string }> = {}

            validate.errors?.forEach(err => {
                const maskedPath = err.dataPath.replace(/\[\d+\]/g, '[*]')
                const key = `${maskedPath} ${err.message}`
                if (!errorGroups[key]) {
                    errorGroups[key] = {
                        count: 0,
                        message: err.message || "",
                        originalPath: err.dataPath,
                        maskedPath: maskedPath
                    }
                }
                errorGroups[key].count++
            })

            const errors = Object.values(errorGroups).map(group => {
                if (group.count > 1) {
                    return `${group.maskedPath} ${group.message} (x${group.count})`
                }
                return `${group.originalPath} ${group.message}`
            })

            return {
                valid: false,
                errors: errors.length > 0 ? errors : ["Unknown error"]
            }
        }
    } catch (e: any) {
        return { valid: false, errors: [`Invalid Schema: ${e.message}`] }
    }
}

export const generateSchemaFromData = (data: any): string => {
    // Simple schema generation logic
    // For a more robust solution, we could use a library, but for now we'll implement a basic one
    // or just infer basic types.

    // Using a simple recursive function to generate schema
    const generate = (obj: any): any => {
        if (obj === null) return { type: "null" }
        if (Array.isArray(obj)) {
            const items = obj.length > 0 ? generate(obj[0]) : {}
            return { type: "array", items }
        }
        if (typeof obj === "object") {
            const properties: Record<string, any> = {}
            for (const key in obj) {
                properties[key] = generate(obj[key])
            }
            return { type: "object", properties }
        }
        return { type: typeof obj }
    }

    try {
        const schema = generate(data)
        return JSON.stringify(schema, null, 2)
    } catch (e) {
        console.error("Failed to generate schema", e)
        return "{}"
    }
}
