'use strict';

function convertAnnouncement(announcement) {
    return {
        id: announcement._id,
        notified_at: announcement.updatedAt,
        title: announcement.title,
        details: announcement.details, // TODO: render markdown
        url: announcement.url
    };
}