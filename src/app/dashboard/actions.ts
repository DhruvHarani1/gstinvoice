'use server';

import { revalidatePath } from 'next/cache';

/**
 * Server Action to revalidate static router cache from client components.
 */
export async function revalidatePathAction(path: string) {
  try {
    revalidatePath(path);
    return { success: true };
  } catch (error) {
    console.error(`Failed to revalidate path: ${path}`, error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}
