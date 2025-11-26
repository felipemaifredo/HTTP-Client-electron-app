import { quicktype, InputData, jsonInputForTargetLanguage } from "quicktype-core";

export async function generateTypes(jsonString: string, typeName: string = "Response"): Promise<string> {
    try {
        const jsonInput = jsonInputForTargetLanguage("typescript");
        await jsonInput.addSource({
            name: typeName,
            samples: [jsonString],
        });

        const inputData = new InputData();
        inputData.addInput(jsonInput);

        const result = await quicktype({
            inputData,
            lang: "typescript",
            rendererOptions: {
                "just-types": "true",
                "explicit-unions": "true",
            },
        });

        return result.lines.join("\n");
    } catch (error) {
        console.error("Error generating types:", error);
        return "// Error generating types. Please check the console for details.";
    }
}
