
// TODO implement
const formatTimestamp = isoTimestampString => isoTimestampString;

function formatGameName(gameName) {
    switch (gameName.toLowerCase()) {
        case 'table tennis':
            return ':table_tennis_paddle_and_ball:';
        case 'klask':
            return ':klask:';
        default:
            return gameName;
    }
}

const formatUser = ({ challongeUsername, challongeEmailHash }) => `*${challongeUsername}* (${challongeEmailHash ? 'verified' : 'unverified'})`;

const formatMatch = (match, currentUserEmailHash) =>
    `${formatParticipant(match.player1, currentUserEmailHash)} vs ${formatParticipant(match.player2, currentUserEmailHash)}`;

const formatParticipant = (participant, currentUserEmailHash) => participant
    ? participant.email_hash === currentUserEmailHash
        ? `*${participant.display_name}* (you)`
        : `*${participant.display_name}*`
    : ':grey_question:';

module.exports = {
    formatTimestamp,
    formatGameName,
    formatUser,
    formatMatch,
    formatParticipant,
};