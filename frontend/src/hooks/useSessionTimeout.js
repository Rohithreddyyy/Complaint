import { useEffect } from "react";
import toast from "react-hot-toast";

function useSessionTimeout(navigate) {

  useEffect(() => {

    let timer;
    let warningTimer;

    const resetTimer = () => {

      clearTimeout(timer);
      clearTimeout(warningTimer);

      warningTimer = setTimeout(() => {
        toast("Session expiring soon ⚠️");
      }, 14 * 60 * 1000);

      timer = setTimeout(() => {
        localStorage.removeItem("user");
        toast.error("Session expired. Please login again.");
        navigate("/");
      }, 15 * 60 * 1000);
    };

    window.addEventListener("mousemove", resetTimer);
    window.addEventListener("keydown", resetTimer);
    window.addEventListener("click", resetTimer);

    resetTimer();

    return () => {
      clearTimeout(timer);
      clearTimeout(warningTimer);
    };

  }, [navigate]);

}

export default useSessionTimeout;