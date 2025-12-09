import { Router } from "express";
import { searchUsers ,getUser} from "../controller/search.controller";

const router = Router();

router.route("/users").get(searchUsers);
router.route("/user").get(getUser);

export default router;
