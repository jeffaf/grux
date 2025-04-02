/**
 * Command history search functionality for terminal
 */

import { ColorManager, SGR } from './colors';

export interface SearchResult {
  command: string;
  matchIndex: number;
  searchIndex: number;
}

export class HistorySearch {
  private searchTerm: string = '';
  private searchResults: SearchResult[] = [];
  private currentIndex: number = -1;
  private isActive: boolean = false;

  constructor() {}

  /**
   * Start a new search
   */
  start(): void {
    this.searchTerm = '';
    this.searchResults = [];
    this.currentIndex = -1;
    this.isActive = true;
  }

  /**
   * Add character to search term
   */
  addChar(char: string): void {
    if (!this.isActive) return;
    this.searchTerm += char;
  }

  /**
   * Remove last character from search term
   */
  backspace(): void {
    if (!this.isActive || this.searchTerm.length === 0) return;
    this.searchTerm = this.searchTerm.slice(0, -1);
  }

  /**
   * Search through history for matching commands
   */
  search(history: string[]): SearchResult[] {
    if (!this.isActive || this.searchTerm.length === 0) {
      this.searchResults = [];
      return [];
    }

    this.searchResults = history
      .map((command, index) => {
        const matchIndex = command.toLowerCase().indexOf(this.searchTerm.toLowerCase());
        if (matchIndex !== -1) {
          return { command, matchIndex, searchIndex: index };
        }
        return null;
      })
      .filter((result): result is SearchResult => result !== null);

    return this.searchResults;
  }

  /**
   * Move to next search result
   */
  next(): SearchResult | null {
    if (!this.isActive || this.searchResults.length === 0) return null;
    
    this.currentIndex = (this.currentIndex + 1) % this.searchResults.length;
    return this.searchResults[this.currentIndex];
  }

  /**
   * Move to previous search result
   */
  previous(): SearchResult | null {
    if (!this.isActive || this.searchResults.length === 0) return null;
    
    this.currentIndex--;
    if (this.currentIndex < 0) {
      this.currentIndex = this.searchResults.length - 1;
    }
    return this.searchResults[this.currentIndex];
  }

  /**
   * Format search prompt with current state
   */
  getPrompt(): string {
    if (!this.isActive) return '';

    const count = this.searchResults.length;
    const position = this.currentIndex + 1;
    const countDisplay = count > 0 ? `(${position}/${count})` : '';

    return ColorManager.style(
      `(reverse-i-search)${countDisplay}'${this.searchTerm}': `,
      ['brightCyan']
    );
  }

  /**
   * Format command with highlighted search term
   */
  highlightMatch(result: SearchResult): string {
    const { command, matchIndex } = result;
    const beforeMatch = command.slice(0, matchIndex);
    const match = command.slice(matchIndex, matchIndex + this.searchTerm.length);
    const afterMatch = command.slice(matchIndex + this.searchTerm.length);

    return (
      beforeMatch +
      ColorManager.style(match, ['brightYellow', 'bold']) +
      afterMatch
    );
  }

  /**
   * Cancel search
   */
  cancel(): void {
    this.isActive = false;
    this.searchTerm = '';
    this.searchResults = [];
    this.currentIndex = -1;
  }

  /**
   * Check if search is active
   */
  isSearching(): boolean {
    return this.isActive;
  }

  /**
   * Get current search term
   */
  getSearchTerm(): string {
    return this.searchTerm;
  }

  /**
   * Get current search result
   */
  getCurrentResult(): SearchResult | null {
    if (!this.isActive || this.currentIndex === -1) return null;
    return this.searchResults[this.currentIndex];
  }
}