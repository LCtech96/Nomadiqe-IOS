/**
 * Types Index - Export all types
 */

export * from './user';
export * from './property';
export * from './post';
export * from './navigation';

// Database types
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: any;
        Insert: any;
        Update: any;
      };
      properties: {
        Row: any;
        Insert: any;
        Update: any;
      };
      posts: {
        Row: any;
        Insert: any;
        Update: any;
      };
      // Add other tables as needed
    };
  };
}
