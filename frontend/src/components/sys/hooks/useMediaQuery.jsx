import {useEffect, useState} from "react";

export function useMediaQuery(query) {
    const [matches, setMatches] = useState(false);

    useEffect(() => {
        const media = window.matchMedia(query);
        if (media.matches !== matches) {
            setMatches(media.matches);
        }
        const changeListener = function (e) {
            if (e.matches !== matches) {
                setMatches(media.matches);
            }
        }
        media.addEventListener("change", changeListener)
        const listener = () => setMatches(media.matches);
        window.addEventListener("resize", listener);
        return () => {
            media.removeEventListener("change", changeListener)
            window.removeEventListener("resize", listener);
        };
    }, [matches, query]);

    return matches;
}