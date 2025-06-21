//Logout from spotify account
export function spotifyLogOut() {                                                                                   //When function is ran logs user out of the spotify
    localStorage.removeItem("spotify_access_token");

    const spotifyLogoutWindow = window.open("https://accounts.spotify.com/en/logout", "_blank");

    setTimeout(() => {
    spotifyLogoutWindow.close();
    window.location.href = "/";
    }, 1500);
}
