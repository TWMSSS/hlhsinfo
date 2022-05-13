async function getShared(req, res) {

    if (!req.body.sharedID) return res.status(403).json({ message: 'You need to provide the sharedID!' });

    var data = global.sharedScores.scores.find(x => x.id === req.body.sharedID);
    
    if (!data) return res.status(404).json({ message: 'The shared score is not found!' });

    if (data && data.expiredTimestamp < Date.now()) {
        var index = global.sharedScores.scores.findIndex(dt => dt.id === req.body.id);
        global.sharedScores.scores.splice(index, 1);
        return res.status(404).json({ message: 'The shared score is expired!' });
    }

    res.status(200).json({
        message: 'Success!',
        data: {
            data: data.data.userScore.data,
            extra: data.data.userScore.extra,
            unpass: data.data.userScore.unpass,
            userInfo: data.data.userInfo,
            created: data.created,
            expired: data.expired,
            sharedID: data.id,
            scoreInfo: {
                year: data.data.year,
                term: data.data.term,
                times: data.data.times,
            }
        }
    });
}

module.exports.getShared = getShared;