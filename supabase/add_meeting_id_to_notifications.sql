ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS meeting_id uuid REFERENCES public.video_meetings(id) ON DELETE SET NULL;

-- Best-effort backfill: link existing meeting-related notifications to their video_meetings row
UPDATE public.notifications n
SET meeting_id = vm.id
FROM public.video_meetings vm
WHERE n.meeting_id IS NULL
  AND (
    (n.type = 'video_meeting_request' AND vm.requester_id = n.sender_id AND vm.recipient_id = n.recipient_id)
    OR
    (n.type = 'meeting_accepted' AND vm.requester_id = n.recipient_id AND vm.recipient_id = n.sender_id)
  );
