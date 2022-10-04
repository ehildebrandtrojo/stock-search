import { writable } from 'svelte/store';

// List of selected symbols
export const selected_symbols = writable([]);

// List of favorites symbols
export const favorite_symbols = writable([]);