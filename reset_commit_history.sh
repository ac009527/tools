git checkout --orphan latest_branch
git add -A
git commit -am "reset commit history"
git branch -D main
git branch -m main
git push --set-upstream origin main
git push -uf origin main

