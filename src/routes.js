import { Router } from 'express';

import oils from 'routes/oils';

let router = new Router();

router.use( '/oils', oils );

export default router;