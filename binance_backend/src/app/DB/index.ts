import config from "../config";
import { USER_ROLE } from "../modules/User/user.const";
import { User } from "../modules/User/user.model";

const superAdmin = {
  name: "Super Admin",
  email: config.super_admin_email,
  password: config.super_admin_password,
  role: USER_ROLE.superAdmin,
};

const seedSuperAdmin = async () => {
  const isSuperAdminExist = await User.findOne({
    role: USER_ROLE.superAdmin,
  });

  if (!isSuperAdminExist) {
    await User.create(superAdmin);
    console.log("Super Admin created successfully");
  }
};

export default seedSuperAdmin;