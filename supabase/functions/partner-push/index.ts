import webpush from 'npm:web-push@3.6.7';
import { createPushHandler } from './handler.mjs';
Deno.serve(createPushHandler({url:Deno.env.get('SUPABASE_URL')!,key:Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,webpush}));
