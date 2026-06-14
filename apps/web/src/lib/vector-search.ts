import { pipeline, env } from '@xenova/transformers';

// Skip local model checks and use cache, prevent Next.js edge runtime issues
env.allowLocalModels = false;

// We use a singleton pattern to keep the model loaded in memory
class PipelineSingleton {
    static task = 'feature-extraction';
    static model = 'Supabase/gte-small'; // Tiny, fast, 384 dimensions
    static instance: any = null;

    static async getInstance(progress_callback: any = null) {
        if (this.instance === null) {
            this.instance = pipeline(this.task as any, this.model, { progress_callback });
        }
        return this.instance;
    }
}

/**
 * Generate a dense vector embedding for a given text.
 */
export async function generateEmbedding(text: string): Promise<number[]> {
    const embedder = await PipelineSingleton.getInstance();
    // Generate embeddings
    const output = await embedder(text, { pooling: 'mean', normalize: true });
    // Convert Tensor to standard JS array
    return Array.from(output.data);
}

/**
 * Calculate the Cosine Similarity between two vectors.
 * Returns a score between -1 and 1. Closer to 1 means more similar.
 */
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
    if (vecA.length !== vecB.length) return 0;
    
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < vecA.length; i++) {
        dotProduct += vecA[i] * vecB[i];
        normA += vecA[i] * vecA[i];
        normB += vecB[i] * vecB[i];
    }
    
    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}
