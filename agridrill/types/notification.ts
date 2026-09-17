export interface Notification {
  readonly id: number;
  readonly created_at: string;
  readonly type: string;
  readonly message: string;
  readonly is_read: boolean;
}