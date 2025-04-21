const MODEL_NAME = "gemma3:12b";
/**
 * Uses Ollama to categorize a grocery item into the appropriate department
 */
export async function categorizeItemWithLLM(
  itemName: string,
  departments: Array<{ displayName: string; description?: string; id: string }>,
): Promise<{ category: string }> {
  console.log(`Attempting to categorize item: ${itemName}`);
  console.log("Available departments:", departments);

  // Create a simple prompt for the LLM
  const prompt = `
  I need to categorize this grocery item: "${itemName}"
  
  Available departments:
  ${departments.map(d => `- ${d.displayName}${d.description ? ` (${d.description})` : ""}`).join("\n")}
  
  Please respond with only the name of the most appropriate department from the list above.
  `;

  console.log("Generated prompt:", prompt);

  try {
    // Make request to the Ollama API
    console.log("Making request to Ollama API...");
    const response = await fetch("http://192.168.0.222:7869/api/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL_NAME,
        prompt,
        stream: false,
      }),
    });

    if (!response.ok) {
      console.error("Ollama API error:", response.status);
      return { category: "default" };
    }

    const data = await response.json();
    console.log("Received response from Ollama:", data);

    // Clean up the response to get just the department name
    let category = data.response.trim();
    console.log("Cleaned category response:", category);

    // Check if the returned category matches any of our departments
    const matchingDept = departments.find(dept => dept.displayName.toLowerCase() === category.toLowerCase());

    if (matchingDept) {
      console.log("Found matching department:", matchingDept.displayName);
      return { category: matchingDept.id };
    }

    // If no exact match, return the first department or default
    console.log("No matching department found, returning unknown");
    return { category: "unknown" }; //departments.length > 0 ? departments[0].displayName : "default" };
  } catch (error) {
    console.error("Error calling Ollama:", error);
    return { category: "default" };
  }
}
/**
 * Uses Ollama to normalize a grocery item name
 * This helps standardize item names for better autocomplete and deduplication
 *
 * @returns An object with either:
 * - success: true and normalizedName: string - when normalization succeeded
 * - success: false and error: string - when normalization failed
 */
export async function normalizeItemNameWithLLM(itemName: string): Promise<{ success: boolean; normalizedName?: string; error?: string }> {
  console.log(`Attempting to normalize item name: ${itemName}`);

  // Create a prompt for the LLM to normalize the item name
  const prompt = `
I need to normalize this grocery item name: "${itemName}"

Please respond with a normalized, standardized version of this grocery item name.
Follow these rules:
1. Use singular form unless it's naturally plural (like "eggs" or "beans"), or sold as a unit (like "pretzels")
2. Remove brand names unless the item is uniquely identified by its brand, or if a user would want to specify a specific brand to buy from the grocery store (such as LaCroix, instead of Sparking Water)
3. Use lowercase
4. Remove unnecessary adjectives (like "fresh" or "organic"), unless it's part of the brand name (if you're unsure, leave it in)
5. Use the most common, generic name for the item
6. Return ONLY the normalized name with no additional text or explanation
7. If the response would be 2 words, use hyphens "-" instead of spaces

Example inputs and expected outputs:
"2 Red Delicious Apples" -> "apple"
"Organic Whole Milk" -> "milk"
"Heinz Ketchup" -> "ketchup"
"Fresh Eggs" -> "eggs"
"Lacroix" -> "LaCroix"
"Frozen Pizza" -> "pizza"
`;

  try {
    // Make request to the Ollama API
    console.log("Making request to Ollama API for normalization...");
    const response = await fetch("http://192.168.0.222:7869/api/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL_NAME,
        prompt,
        stream: false,
      }),
    });

    if (!response.ok) {
      console.error("Ollama API error during normalization:", response.status);
      return {
        success: false,
        error: `Ollama API returned status ${response.status}`,
      };
    }

    const data = await response.json();
    console.log("Received normalization response from Ollama:", data);

    // Clean up the response to get just the normalized name
    let normalizedName = data.response.trim().toLowerCase();
    console.log("Normalized item name:", normalizedName);

    return {
      success: true,
      normalizedName,
    };
  } catch (error) {
    console.error("Error calling Ollama for normalization:", error);
    return {
      success: false,
      error: `Exception while calling Ollama: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}
