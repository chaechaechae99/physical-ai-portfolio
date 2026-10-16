-- 트리거 전용 함수는 API로 호출할 수 없게
revoke execute on function public.handle_new_user() from public, anon, authenticated;
