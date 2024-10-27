import { RxCross2 } from "react-icons/rx";
import useConversation from "../zustand/useConversation";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "../context/authContextProvider";
import { useState } from "react";
import axios from "axios";

const Signin = () => {
  const { openSignin, setOpenSignin, openRegister, setOpenRegister } =
    useConversation();
  const navigate = useNavigate();
  const { setAuthUser } = useAuthContext();
  const [loading, setLoading] = useState(false);

  const [data, setData] = useState({
    fullname: "",
    email: "",
    password: "",
    address: "",
    gender: "",
  });

  const handleClose = () => {
    setOpenSignin(false);
    setOpenRegister(false);
  };

  const handleChange = (e) => {
    setData({ ...data, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await axios.post(
        `/api/auth/${openSignin ? "login" : "register"}`,
        data,
        { withCredentials: true }
      );
      if (response.data.message === "login successfully") {
        const userData = response.data.data;
        localStorage.setItem("user", JSON.stringify(userData));
        setAuthUser(userData);
        navigate("/message");
      } else if (response.data.message === "register successfully") {
        setOpenRegister(false);
        setOpenSignin(true);
      }
    } catch (error) {
      console.error("Error during authentication:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`${openSignin || openRegister ? "visible" : "hidden"}`}>
      <div className="fixed top-1/2 left-1/2 w-[400px] h-[400px] max-md:w-[300px] max-md:h-[400px] bg-[#3EE4CA] text-[#12141d] transform -translate-x-1/2 -translate-y-1/2 z-20 rounded-3xl shadow-lg">
        <div className="fixed right-1 md:-right-10 w-[40px] h-[40px] flex justify-center items-center rounded-full cursor-pointer">
          <RxCross2
            onClick={handleClose}
            className="max-sm:text-black text-white"
          />
        </div>
        <div className="flex justify-center items-center h-full">
          <form
            onSubmit={handleSubmit}
            className="flex flex-col items-center gap-5 w-full px-6"
          >
            <h1 className="uppercase font-bold">
              {openSignin ? "Login" : "Register"}
            </h1>
            {openRegister && (
              <input
                type="text"
                name="fullname"
                placeholder="Full Name"
                value={data.fullname}
                onChange={handleChange}
                className="text-center py-2 px-4 bg-[#12141d] text-white placeholder:text-gray-500 rounded-3xl max-md:w-[250px]"
                autoComplete="name"
              />
            )}
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={data.email}
              onChange={handleChange}
              className="text-center py-2 px-4 bg-[#12141d] text-white placeholder:text-gray-500 rounded-3xl max-md:w-[250px]"
              autoComplete={openSignin ? "email" : "new-email"}
            />
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={data.password}
              onChange={handleChange}
              className="text-center py-2 px-4 bg-[#12141d] text-white placeholder:text-gray-500 rounded-3xl max-md:w-[250px]"
              autoComplete={openSignin ? "current-password" : "new-password"}
            />
            {openRegister && (
              <>
                <input
                  type="text"
                  name="address"
                  placeholder="Address"
                  value={data.address}
                  onChange={handleChange}
                  className="text-center py-2 px-4 bg-[#12141d] text-white placeholder:text-gray-500 rounded-3xl max-md:w-[250px]"
                  autoComplete="street-address"
                />
                <div className="flex items-center gap-2">
                  <p className="uppercase font-bold">Gender:</p>
                  <label className="flex items-center gap-1">
                    <input
                      type="radio"
                      name="gender"
                      value="male"
                      checked={data.gender === "male"}
                      onChange={handleChange}
                      className="accent-[#12141d]"
                    />
                    Male
                  </label>
                  <label className="flex items-center gap-1">
                    <input
                      type="radio"
                      name="gender"
                      value="female"
                      checked={data.gender === "female"}
                      onChange={handleChange}
                      className="accent-[#12141d]"
                    />
                    Female
                  </label>
                </div>
              </>
            )}
            {loading ? (
              <>
                <div className=" text-white">
                  <div role="status">
                    <svg
                      aria-hidden="true"
                      class="inline w-8 h-8 text-white animate-spin dark:white fill-black"
                      viewBox="0 0 100 101"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                        fill="currentColor"
                      />
                      <path
                        d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                        fill="currentFill"
                      />
                    </svg>
                  </div>
                </div>
              </>
            ) : (
              <button
                type="submit"
                className="py-2 px-5 bg-[#12141d] text-white rounded-3xl"
              >
                {openSignin ? "Login" : "Register"}
              </button>
            )}
          </form>
        </div>
      </div>
      <div className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-50 backdrop-blur-lg z-10"></div>
    </div>
  );
};

export default Signin;