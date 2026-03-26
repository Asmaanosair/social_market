import { router } from "./index";
import { postRouter } from "./routers/post";
import { scheduleRouter } from "./routers/schedule";
import { analyticsRouter } from "./routers/analytics";
import { accountRouter } from "./routers/account";
import { userRouter } from "./routers/user";
import { teamRouter } from "./routers/team";

export const appRouter = router({
  post: postRouter,
  schedule: scheduleRouter,
  analytics: analyticsRouter,
  account: accountRouter,
  user: userRouter,
  team: teamRouter,
});

export type AppRouter = typeof appRouter;
