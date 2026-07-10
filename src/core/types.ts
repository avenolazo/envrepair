/**
 * Defines the classification of a line in a .env file.
 * Used to preserve file formatting during updates.
 */
export type LineType = 'comment' | 'blank' | 'variable';

/**
 * Represents a parsed line from a .env file.
 * Retains formatting details to allow safe round-trip rewriting.
 */
export interface EnvLine {
  /**
   * The semantic type of the line.
   */
  type: LineType;
  /**
   * The key name, defined only if the line is classified as a variable.
   */
  key?: string;
  /**
   * The value, defined only if the line is classified as a variable.
   * Can be an empty string if the variable has no defined value.
   */
  value?: string;
  /**
   * The exact original line content.
   * Preserved to guarantee byte-for-byte fidelity when writing back unmodified lines.
   */
  raw: string;
}

/**
 * An ordered list of lines representing a structured .env document.
 */
export type EnvDocument = EnvLine[];

/**
 * Represents the differences between a template example file and an active environment file.
 */
export interface DiffResult {
  /**
   * Variables found in the example file but missing or empty in the active environment.
   */
  missing: MissingVariable[];
  /**
   * Variables defined in the active environment but absent in the example file.
   */
  unused: string[];
  /**
   * Variables present and populated in both documents.
   */
  synced: string[];
}

/**
 * Represents a variable that needs configuration.
 */
export interface MissingVariable {
  /**
   * The key of the missing environment variable.
   */
  key: string;
  /**
   * The default value extracted from the example file, if any.
   */
  defaultValue?: string;
  /**
   * Indicates whether the variable holds sensitive data (e.g., API keys, passwords).
   * Used to determine if interactive inputs should mask characters.
   */
  isSensitive: boolean;
  /**
   * Explanatory context parsed from the comment preceding the variable in the example file.
   * Kept to assist developers in understanding the purpose of the variable.
   */
  description?: string;
}
