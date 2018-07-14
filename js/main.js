window.onload = function() {
    console.log('ready to execute JS');
    let desktopOsName = null;
    let downloadCenter = document.querySelector('#download-center');
    let downloadButtonContainer = document.querySelector('.download-button-container');

    const osList = {
        windows: {
            niceName: 'Windows',
            iconClass: 'fa-windows',
            downloadExtensions: ['exe']
        },
        mac: {
            niceName: 'Mac',
            iconClass: 'fa-apple',
            downloadExtensions: ['dmg']
        },
        linux: {
            niceName: 'Linux',
            iconClass: 'fa-linux',
            downloadExtensions: ['AppImage', 'deb', 'snap', 'pacman']
        }
    }

    if (navigator.appVersion.indexOf("Win") != -1) {
        desktopOsName = "windows";
    } else if (navigator.appVersion.indexOf("Mac") != -1) {
        desktopOsName = "mac";
    } else if (navigator.appVersion.indexOf("Linux") != -1) {
        desktopOsName = "linux";
    }

    if ('fetch' in window && desktopOsName in osList) {
        let releaseAssetsForOs = [];
        fetch('https://api.github.com/repos/chrisknepper/android-messages-desktop/releases/latest')
        .then((result) => {
            return result.json();
        })
        .then((releaseInfo) => {
            console.log('github release info', releaseInfo);
            if ('assets' in releaseInfo) {
                let extensionsToMatchForRegex = osList[desktopOsName].downloadExtensions.join('|');
                let downloadButtonAreaClone = downloadButtonContainer.cloneNode(true);
                downloadCenter.removeChild(downloadButtonContainer);
                console.log('downloadButtonAreaClone', downloadButtonAreaClone);
                console.log('extensions', extensionsToMatchForRegex);
                let releasesForPlatform = releaseInfo.assets.filter((asset) => {
                    return asset.name.match(`^.*(${extensionsToMatchForRegex})$`);
                });

                let downloadButtonAreaCloneClone = downloadButtonAreaClone.cloneNode(true);
                let downloadButton = downloadButtonAreaCloneClone.querySelector('.download-button');
                let downloadButtonIcon = downloadButton.querySelector('.download-button-container-icon');
                let downloadExtraInfo = downloadButtonAreaCloneClone.querySelector('.download-extra-info');
                downloadButtonIcon.classList.add('fa', osList[desktopOsName].iconClass);
                downloadButton.innerHTML += ` for ${desktopOsName[0].toUpperCase()}${desktopOsName.slice(1)}`;

                if (releasesForPlatform.length > 1) {
                    downloadButton.classList.add('dropdown-toggle');
                    downloadButton.dataset.toggle = 'dropdown';
                    downloadButton.href = '#';
                    let dropdownMenu = downloadButtonAreaCloneClone.querySelector('.dropdown-menu');
                    console.log('downloadButton', downloadButton);
                    console.log('release assets for you', releasesForPlatform);
                    for (let i = 0; i < releasesForPlatform.length; i++) {
                        let releaseLink = document.createElement('a');
                        releaseLink.classList = 'dropdown-item';
                        releaseLink.href = releasesForPlatform[i].browser_download_url
                        let extension = releasesForPlatform[i].name.slice(releasesForPlatform[i].name.lastIndexOf('.'));
                        releaseLink.innerHTML = `${releaseInfo.tag_name}, ${extension}, ${(releasesForPlatform[0].size / Math.pow(1024, 2)).toFixed(1)} MB`;
                        dropdownMenu.appendChild(releaseLink);
                    }
                } else {
                    let extension = releasesForPlatform[0].name.slice(releasesForPlatform[0].name.lastIndexOf('.'));
                    downloadButton.href = releasesForPlatform[0].browser_download_url;
                    downloadExtraInfo.innerHTML = `${releaseInfo.tag_name}, ${extension}, ${(releasesForPlatform[0].size / Math.pow(1024, 2)).toFixed(1)} MB`;
                }

                downloadCenter.appendChild(downloadButtonAreaCloneClone);

            }
        });
    }

};
