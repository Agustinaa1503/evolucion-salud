export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      activity_logs: {
        Row: {
          course_id: string | null
          created_at: string
          event: string
          id: string
          payload: Json
          user_id: string | null
        }
        Insert: {
          course_id?: string | null
          created_at?: string
          event: string
          id?: string
          payload?: Json
          user_id?: string | null
        }
        Update: {
          course_id?: string | null
          created_at?: string
          event?: string
          id?: string
          payload?: Json
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_logs_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      certificates: {
        Row: {
          certificate_number: string
          course_id: string
          created_at: string
          id: string
          issued_at: string
          pdf_path: string | null
          user_id: string
        }
        Insert: {
          certificate_number: string
          course_id: string
          created_at?: string
          id?: string
          issued_at?: string
          pdf_path?: string | null
          user_id: string
        }
        Update: {
          certificate_number?: string
          course_id?: string
          created_at?: string
          id?: string
          issued_at?: string
          pdf_path?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "certificates_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certificates_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_messages: {
        Row: {
          created_at: string
          email: string
          id: string
          message: string
          name: string
          status: string
          topic: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
          status?: string
          topic?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          status?: string
          topic?: string | null
        }
        Relationships: []
      }
      course_lessons: {
        Row: {
          course_id: string
          created_at: string
          description: string | null
          duration: string | null
          duration_seconds: number | null
          id: string
          is_free: boolean
          lesson_key: string
          module_id: string
          platform: string | null
          position: number
          resource_url: string | null
          title: string
          type: string
          updated_at: string
          video_url: string | null
        }
        Insert: {
          course_id: string
          created_at?: string
          description?: string | null
          duration?: string | null
          duration_seconds?: number | null
          id?: string
          is_free?: boolean
          lesson_key: string
          module_id: string
          platform?: string | null
          position?: number
          resource_url?: string | null
          title: string
          type: string
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          course_id?: string
          created_at?: string
          description?: string | null
          duration?: string | null
          duration_seconds?: number | null
          id?: string
          is_free?: boolean
          lesson_key?: string
          module_id?: string
          platform?: string | null
          position?: number
          resource_url?: string | null
          title?: string
          type?: string
          updated_at?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "course_lessons_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_lessons_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "course_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      course_modules: {
        Row: {
          course_id: string
          created_at: string
          description: string | null
          id: string
          md_id: string | null
          position: number
          title: string
          updated_at: string
        }
        Insert: {
          course_id: string
          created_at?: string
          description?: string | null
          id?: string
          md_id?: string | null
          position?: number
          title: string
          updated_at?: string
        }
        Update: {
          course_id?: string
          created_at?: string
          description?: string | null
          id?: string
          md_id?: string | null
          position?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_modules_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      course_quizzes: {
        Row: {
          course_id: string
          created_at: string
          cta_label: string | null
          description: string | null
          id: string
          pass_threshold: number
          position: number
          title: string | null
          updated_at: string
        }
        Insert: {
          course_id: string
          created_at?: string
          cta_label?: string | null
          description?: string | null
          id?: string
          pass_threshold?: number
          position?: number
          title?: string | null
          updated_at?: string
        }
        Update: {
          course_id?: string
          created_at?: string
          cta_label?: string | null
          description?: string | null
          id?: string
          pass_threshold?: number
          position?: number
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_quizzes_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      course_resources: {
        Row: {
          course_id: string
          created_at: string
          description: string | null
          id: string
          position: number
          title: string
          type: string
          updated_at: string
          url: string
        }
        Insert: {
          course_id: string
          created_at?: string
          description?: string | null
          id?: string
          position?: number
          title: string
          type?: string
          updated_at?: string
          url: string
        }
        Update: {
          course_id?: string
          created_at?: string
          description?: string | null
          id?: string
          position?: number
          title?: string
          type?: string
          updated_at?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_resources_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      course_videos: {
        Row: {
          course_id: string
          created_at: string
          description: string | null
          duration: string | null
          id: string
          position: number
          title: string
          url: string
        }
        Insert: {
          course_id: string
          created_at?: string
          description?: string | null
          duration?: string | null
          id?: string
          position?: number
          title: string
          url: string
        }
        Update: {
          course_id?: string
          created_at?: string
          description?: string | null
          duration?: string | null
          id?: string
          position?: number
          title?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_videos_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          banner: string | null
          category: string
          created_at: string
          cta: string
          currency: string
          description: string | null
          difficulty: string | null
          duration: string | null
          duration_seconds: number | null
          external_url: string | null
          featured: boolean
          has_certificate: boolean
          has_quiz: boolean
          id: string
          level: string | null
          price: number | null
          seo: Json
          slug: string
          status: string
          subtitle: string | null
          tags: string[]
          thumbnail: string | null
          title: string
          type: string
          updated_at: string
          visibility: string
        }
        Insert: {
          banner?: string | null
          category?: string
          created_at?: string
          cta?: string
          currency?: string
          description?: string | null
          difficulty?: string | null
          duration?: string | null
          duration_seconds?: number | null
          external_url?: string | null
          featured?: boolean
          has_certificate?: boolean
          has_quiz?: boolean
          id?: string
          level?: string | null
          price?: number | null
          seo?: Json
          slug: string
          status?: string
          subtitle?: string | null
          tags?: string[]
          thumbnail?: string | null
          title: string
          type?: string
          updated_at?: string
          visibility?: string
        }
        Update: {
          banner?: string | null
          category?: string
          created_at?: string
          cta?: string
          currency?: string
          description?: string | null
          difficulty?: string | null
          duration?: string | null
          duration_seconds?: number | null
          external_url?: string | null
          featured?: boolean
          has_certificate?: boolean
          has_quiz?: boolean
          id?: string
          level?: string | null
          price?: number | null
          seo?: Json
          slug?: string
          status?: string
          subtitle?: string | null
          tags?: string[]
          thumbnail?: string | null
          title?: string
          type?: string
          updated_at?: string
          visibility?: string
        }
        Relationships: []
      }
      curso_respuestas: {
        Row: {
          answers: Json
          course_slug: string
          created_at: string
          id: string
          source: string
        }
        Insert: {
          answers?: Json
          course_slug: string
          created_at?: string
          id?: string
          source?: string
        }
        Update: {
          answers?: Json
          course_slug?: string
          created_at?: string
          id?: string
          source?: string
        }
        Relationships: []
      }
      lead_magnet_downloads: {
        Row: {
          access_code: string
          downloaded_at: string
          email: string
          id: string
          lead_magnet_slug: string
          name: string | null
        }
        Insert: {
          access_code: string
          downloaded_at?: string
          email: string
          id?: string
          lead_magnet_slug: string
          name?: string | null
        }
        Update: {
          access_code?: string
          downloaded_at?: string
          email?: string
          id?: string
          lead_magnet_slug?: string
          name?: string | null
        }
        Relationships: []
      }
      newsletter_subscribers: {
        Row: {
          created_at: string
          email: string
          id: string
          name: string | null
          source: string | null
          status: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          name?: string | null
          source?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          name?: string | null
          source?: string | null
          status?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          link: string | null
          read_at: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          read_at?: string | null
          title: string
          type?: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          read_at?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string
          currency: string
          customer_name: string
          email: string
          id: string
          items: Json
          mp_payment_id: string | null
          mp_preference_id: string | null
          mp_status: string | null
          paid_at: string | null
          payment_method: string
          status: string
          subtotal: number
        }
        Insert: {
          created_at?: string
          currency?: string
          customer_name: string
          email: string
          id?: string
          items?: Json
          mp_payment_id?: string | null
          mp_preference_id?: string | null
          mp_status?: string | null
          paid_at?: string | null
          payment_method: string
          status?: string
          subtotal?: number
        }
        Update: {
          created_at?: string
          currency?: string
          customer_name?: string
          email?: string
          id?: string
          items?: Json
          mp_payment_id?: string | null
          mp_preference_id?: string | null
          mp_status?: string | null
          paid_at?: string | null
          payment_method?: string
          status?: string
          subtotal?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          apellido: string | null
          avatar_url: string | null
          created_at: string
          email: string | null
          estado: string
          id: string
          last_sign_in_at: string | null
          nombre: string | null
          rol: string
          updated_at: string
        }
        Insert: {
          apellido?: string | null
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          estado?: string
          id: string
          last_sign_in_at?: string | null
          nombre?: string | null
          rol?: string
          updated_at?: string
        }
        Update: {
          apellido?: string | null
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          estado?: string
          id?: string
          last_sign_in_at?: string | null
          nombre?: string | null
          rol?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_rol_fkey"
            columns: ["rol"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["slug"]
          },
        ]
      }
      questionnaire_responses: {
        Row: {
          access_code: string
          ambioma_score: number
          answers: Json
          corporal_avg: number
          created_at: string
          email: string | null
          id: string
          participant_type: string
          percepcion_avg: number
        }
        Insert: {
          access_code: string
          ambioma_score: number
          answers?: Json
          corporal_avg: number
          created_at?: string
          email?: string | null
          id?: string
          participant_type: string
          percepcion_avg: number
        }
        Update: {
          access_code?: string
          ambioma_score?: number
          answers?: Json
          corporal_avg?: number
          created_at?: string
          email?: string | null
          id?: string
          participant_type?: string
          percepcion_avg?: number
        }
        Relationships: []
      }
      quiz_questions: {
        Row: {
          correct: Json | null
          created_at: string
          id: string
          label: string
          options: Json
          placeholder: string | null
          position: number
          quiz_id: string
          required: boolean
          scale: Json | null
          type: string
          updated_at: string
          url: string | null
          url_label: string | null
        }
        Insert: {
          correct?: Json | null
          created_at?: string
          id?: string
          label: string
          options?: Json
          placeholder?: string | null
          position?: number
          quiz_id: string
          required?: boolean
          scale?: Json | null
          type: string
          updated_at?: string
          url?: string | null
          url_label?: string | null
        }
        Update: {
          correct?: Json | null
          created_at?: string
          id?: string
          label?: string
          options?: Json
          placeholder?: string | null
          position?: number
          quiz_id?: string
          required?: boolean
          scale?: Json | null
          type?: string
          updated_at?: string
          url?: string | null
          url_label?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quiz_questions_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "course_quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          created_at: string
          descripcion: string | null
          nombre: string
          slug: string
        }
        Insert: {
          created_at?: string
          descripcion?: string | null
          nombre: string
          slug: string
        }
        Update: {
          created_at?: string
          descripcion?: string | null
          nombre?: string
          slug?: string
        }
        Relationships: []
      }
      user_courses: {
        Row: {
          completed_at: string | null
          course_id: string
          created_at: string
          id: string
          last_access_at: string
          progress_pct: number
          started_at: string
          status: string
          total_study_seconds: number
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          course_id: string
          created_at?: string
          id?: string
          last_access_at?: string
          progress_pct?: number
          started_at?: string
          status?: string
          total_study_seconds?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          course_id?: string
          created_at?: string
          id?: string
          last_access_at?: string
          progress_pct?: number
          started_at?: string
          status?: string
          total_study_seconds?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_courses_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_courses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_lesson_progress: {
        Row: {
          completed_at: string | null
          course_id: string
          created_at: string
          id: string
          lesson_id: string
          status: string
          updated_at: string
          user_id: string
          viewed_at: string
        }
        Insert: {
          completed_at?: string | null
          course_id: string
          created_at?: string
          id?: string
          lesson_id: string
          status?: string
          updated_at?: string
          user_id: string
          viewed_at?: string
        }
        Update: {
          completed_at?: string | null
          course_id?: string
          created_at?: string
          id?: string
          lesson_id?: string
          status?: string
          updated_at?: string
          user_id?: string
          viewed_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_lesson_progress_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_lesson_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "course_lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_lesson_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_quiz_attempts: {
        Row: {
          answers: Json
          course_id: string
          created_at: string
          id: string
          max_score: number | null
          passed: boolean | null
          quiz_id: string | null
          score: number | null
          submitted_at: string
          user_id: string
        }
        Insert: {
          answers?: Json
          course_id: string
          created_at?: string
          id?: string
          max_score?: number | null
          passed?: boolean | null
          quiz_id?: string | null
          score?: number | null
          submitted_at?: string
          user_id: string
        }
        Update: {
          answers?: Json
          course_id?: string
          created_at?: string
          id?: string
          max_score?: number | null
          passed?: boolean | null
          quiz_id?: string | null
          score?: number | null
          submitted_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_quiz_attempts_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_quiz_attempts_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "course_quizzes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_quiz_attempts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_settings: {
        Row: {
          notification_email: boolean
          preferences: Json
          receive_newsletter: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          notification_email?: boolean
          preferences?: Json
          receive_newsletter?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          notification_email?: boolean
          preferences?: Json
          receive_newsletter?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_settings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_video_progress: {
        Row: {
          completed: boolean
          course_id: string
          created_at: string
          duration_seconds: number | null
          id: string
          last_position_at: string
          lesson_id: string | null
          progress_pct: number
          updated_at: string
          user_id: string
          video_url: string
          watched_seconds: number
        }
        Insert: {
          completed?: boolean
          course_id: string
          created_at?: string
          duration_seconds?: number | null
          id?: string
          last_position_at?: string
          lesson_id?: string | null
          progress_pct?: number
          updated_at?: string
          user_id: string
          video_url: string
          watched_seconds?: number
        }
        Update: {
          completed?: boolean
          course_id?: string
          created_at?: string
          duration_seconds?: number | null
          id?: string
          last_position_at?: string
          lesson_id?: string | null
          progress_pct?: number
          updated_at?: string
          user_id?: string
          video_url?: string
          watched_seconds?: number
        }
        Relationships: [
          {
            foreignKeyName: "user_video_progress_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_video_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "course_lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_video_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_certificate_public: {
        Args: { p_id: string }
        Returns: {
          certificate_number: string
          course_title: string
          full_name: string
          issued_at: string
          valid: boolean
        }[]
      }
      is_admin: { Args: never; Returns: boolean }
      issue_certificate: {
        Args: { p_course_id: string; p_pdf_path: string; p_user_id: string }
        Returns: {
          certificate_number: string
          id: string
          issued_at: string
        }[]
      }
      log_activity: {
        Args: {
          p_course_id: string
          p_event: string
          p_payload?: Json
          p_user_id: string
        }
        Returns: undefined
      }
      next_certificate_number: { Args: never; Returns: string }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
