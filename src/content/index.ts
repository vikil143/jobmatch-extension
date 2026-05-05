const { hostname } = window.location

if (hostname.includes('linkedin.com')) {
  console.log('JobMatch: detected linkedin', window.location.href)
} else if (hostname.includes('naukri.com')) {
  console.log('JobMatch: detected naukri', window.location.href)
}
