const R = require('ramda');

const fetchAllTournaments = ({ api, organization }) => async function () {
    const { data } = await api.get('tournaments.json', {
        params: {
            subdomain: organization,
            // state: '...', // one of 'all', 'pending', 'in_progress', 'ended'
        },
    });
    return R.map(({ tournament }) => tournament)(data);
};

const fetchOpenTournaments = ({ api, organization }) => async function (includeUnderway = true) {
    const validStates = includeUnderway
        ? ['pending', 'underway']
        : ['pending'];
    const tournaments = await fetchAllTournaments({ api, organization })();
    return R.filter(({ state }) => validStates.includes(state))(tournaments);
};

const fetchTournament = ({ api }) => async function (tournamentId) {
    const { data } = await api.get(`tournaments/${tournamentId}.json`, {
        params: {
            include_participants: 1,
            include_matches: 1,
        },
    });
    const { tournament } = data;
    return R.evolve({
        participants: R.map(({ participant }) => participant),
        matches: R.map(({ match }) => match),
    })(tournament);
};

const fetchMembers = ({ api, organization }) => async function () {
    const tournaments = await fetchAllTournaments({ api, organization })();

    const tournamentsDetailsPromises = R.pipe(
        R.take(5),
        R.map(({ id }) => id),
        R.map(fetchTournament({ api })),
    )(tournaments);
    const tournamentsDetails = await Promise.all(tournamentsDetailsPromises);

    return R.pipe(
        R.chain(({ participants }) => participants),
        R.uniqBy(({ email_hash }) => email_hash),
        R.project(['username', 'email_hash', 'challonge_email_address_verified']),
    )(tournamentsDetails);
};

const fetchOpenTournamentsForMember = ({ api, organization }) => async function (memberEmailHash, { signedUpFilter = undefined, includeUnderway = true } = {}) {
    const tournaments = await fetchOpenTournaments({ api, organization })(includeUnderway);

    const tournamentsDetailsPromises = R.pipe(
        R.map(({ id }) => id),
        R.map(fetchTournament({ api })),
    )(tournaments);
    const tournamentsDetails = await Promise.all(tournamentsDetailsPromises);

    return R.pipe(
        R.map(t => ({
            ...t,
            is_signed_up: R.any(({ email_hash }) => email_hash === memberEmailHash)(t.participants),
        })),
        R.filter(({ is_signed_up }) => R.isNil(signedUpFilter) || is_signed_up === signedUpFilter),
    )(tournamentsDetails);
};

const fetchOpenMatchesForMember = ({ api, organization }) => async function (memberEmailHash) {
    const tournaments = await fetchOpenTournaments({ api, organization })();

    const tournamentsDetailsPromises = R.pipe(
        R.map(({ id }) => id),
        R.map(fetchTournament({ api })),
    )(tournaments);
    const tournamentsDetails = await Promise.all(tournamentsDetailsPromises);

    const tournamentsById = R.indexBy(t => t.id)(tournaments);

    const participantsById = R.pipe(
        R.chain(({ participants }) => participants),
        R.indexBy(p => p.id),
    )(tournamentsDetails);

    return R.pipe(
        R.chain(({ matches }) => matches),
        R.filter(({ state }) => ['pending', 'open'].includes(state)),
        R.map(m => ({
            ...m,
            tournament: tournamentsById[m.tournament_id],
            player1: m.player1_id ? participantsById[m.player1_id] : null,
            player2: m.player2_id ? participantsById[m.player2_id] : null,
        })),
        R.filter(({ player1, player2 }) =>
            player1 && player1.email_hash === memberEmailHash
                || player2 && player2.email_hash === memberEmailHash),
    )(tournamentsDetails);
};

const addTournamentParticipant = ({ api }) => async function (tournamentId, memberUsername, participantName = undefined) {
    const { data } = await api.post(`tournaments/${tournamentId}/participants.json`, {
        participant: {
            challonge_username: memberUsername,
            name: participantName,
        },
    });
    return data.participant;
};

const challongeService = {
    fetchAllTournaments,
    fetchOpenTournaments,
    fetchTournament,
    fetchMembers,
    fetchOpenTournamentsForMember,
    fetchOpenMatchesForMember,
    addTournamentParticipant,
};

module.exports = challongeService;
