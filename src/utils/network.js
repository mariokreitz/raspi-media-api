import dns from 'dns';

export function checkInternet() {
    dns.lookup('tmdb.org', (err) => {
        if (err) {
            console.error('No internet connection');
        } else {
            console.log('Internet connection available');
        }
    });
}
