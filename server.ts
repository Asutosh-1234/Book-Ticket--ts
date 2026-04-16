import app from "./src/app";
import env from "./src/common/utils/env.js";

const PORT = env.PORT;
app.listen(PORT, () => {
    console.log(`Server is running on port http://localhost:${PORT}`);
});