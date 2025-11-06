$lines = Get-Content script.js
$lines | Select-Object -First 284 > temp.js
"    read.textContent = t.readBtn;" >> temp.js
"    nearest.dataset.dest = 'library';" >> temp.js
"  } else if(which==='cemetery'){" >> temp.js
"    nearest.textContent = t.nearest;" >> temp.js
"    nearest.dataset.label = t.nearest;" >> temp.js
"    body.innerHTML = '<p>' + t.para1 + '</p><p>' + t.para2 + '</p><p>' + t.para3 + '</p>';" >> temp.js
"    read.textContent = t.readBtn;" >> temp.js
"    nearest.dataset.dest = 'cemetery';" >> temp.js
"  } else {" >> temp.js
$lines | Select-Object -Skip 292 >> temp.js
Move-Item temp.js script.js -Force
