"""add_rc_option_bidding

Every vehicle auction now runs two bidding ladders side by side: "With RC" and "Without RC"
(client request, 2026-11-26). The company has to send the insurer both rates for the same
vehicle, so both must be collected in the same auction, and each has its own highest bidder.

A bidder may bid in one ladder or in both; the two never compete with each other.

The existing columns keep their meaning and become the WITH RC ladder, so nothing that reads
starting_price / current_price / current_winner_id / bid_count has to change, and the order
created when an auction closes is still the one for the With RC winner. The new *_without_rc
columns mirror them for the second ladder. starting_price_without_rc is nullable: when it is
not set that ladder simply has no expected amount, and any first bid is accepted.

Existing bids are all With RC: that is the only kind that existed. They are backfilled by the column's
own DEFAULT rather than an UPDATE, because auction_bids is append-only - a BEFORE UPDATE OR DELETE
trigger (auction_bids_no_update_delete) rejects any UPDATE, however few rows it touches. Adding a NOT
NULL column with a default is metadata-only in PostgreSQL 11+, so no row is rewritten and no row
trigger fires.

Revision ID: c7e4a9b2d5f8
Revises: a4d6b2f8c013
Create Date: 2026-11-26 13:00:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'c7e4a9b2d5f8'
down_revision: Union[str, None] = 'a4d6b2f8c013'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ---------------------------------------------------------------- auction_bids.rc_option
    op.add_column('auction_bids', sa.Column('rc_option', sa.String(length=12), nullable=False,
                                            server_default='with_rc'))
    op.alter_column('auction_bids', 'rc_option', server_default=None)   # new bids must say which ladder
    op.create_check_constraint('ck_auction_bids_rc_option', 'auction_bids',
                               "rc_option IN ('with_rc', 'without_rc')")

    # Amounts are unique per ladder, not per auction: the same figure may be bid once With RC and
    # once Without RC, by different people, without either blocking the other.
    op.drop_constraint('uq_auction_bids_auction_amount', 'auction_bids', type_='unique')
    op.create_unique_constraint('uq_auction_bids_auction_option_amount', 'auction_bids',
                                ['auction_id', 'rc_option', 'amount'])

    # ---------------------------------------------------------------- the Without RC ladder
    op.add_column('auctions', sa.Column('starting_price_without_rc', sa.Numeric(14, 2), nullable=True))
    op.add_column('auctions', sa.Column('current_price_without_rc', sa.Numeric(14, 2), nullable=True))
    op.add_column('auctions', sa.Column('current_winner_without_rc_id', sa.UUID(as_uuid=True), nullable=True))
    op.add_column('auctions', sa.Column('bid_count_without_rc', sa.Integer(), server_default='0', nullable=False))
    op.alter_column('auctions', 'bid_count_without_rc', server_default=None)
    op.create_foreign_key('fk_auctions_current_winner_without_rc', 'auctions', 'users',
                          ['current_winner_without_rc_id'], ['id'], ondelete='RESTRICT')
    op.create_check_constraint('ck_auctions_starting_price_without_rc_positive', 'auctions',
                               'starting_price_without_rc IS NULL OR starting_price_without_rc > 0')
    op.create_check_constraint('ck_auctions_current_price_without_rc', 'auctions',
                               'current_price_without_rc IS NULL OR starting_price_without_rc IS NULL'
                               ' OR current_price_without_rc >= starting_price_without_rc')
    op.create_check_constraint('ck_auctions_bid_count_without_rc', 'auctions', 'bid_count_without_rc >= 0')


def downgrade() -> None:
    op.drop_constraint('ck_auctions_bid_count_without_rc', 'auctions', type_='check')
    op.drop_constraint('ck_auctions_current_price_without_rc', 'auctions', type_='check')
    op.drop_constraint('ck_auctions_starting_price_without_rc_positive', 'auctions', type_='check')
    op.drop_constraint('fk_auctions_current_winner_without_rc', 'auctions', type_='foreignkey')
    op.drop_column('auctions', 'bid_count_without_rc')
    op.drop_column('auctions', 'current_winner_without_rc_id')
    op.drop_column('auctions', 'current_price_without_rc')
    op.drop_column('auctions', 'starting_price_without_rc')

    # Without RC bids would break the old "one amount per auction" rule, so they go first. The
    # append-only trigger has to stand aside for that one statement.
    op.execute("ALTER TABLE auction_bids DISABLE TRIGGER auction_bids_no_update_delete")
    op.execute("DELETE FROM auction_bids WHERE rc_option = 'without_rc'")
    op.execute("ALTER TABLE auction_bids ENABLE TRIGGER auction_bids_no_update_delete")
    op.drop_constraint('uq_auction_bids_auction_option_amount', 'auction_bids', type_='unique')
    op.create_unique_constraint('uq_auction_bids_auction_amount', 'auction_bids', ['auction_id', 'amount'])
    op.drop_constraint('ck_auction_bids_rc_option', 'auction_bids', type_='check')
    op.drop_column('auction_bids', 'rc_option')
