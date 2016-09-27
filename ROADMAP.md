# Roadmap
## List of states hercules should detect and handle (ranked)
1. It's not dark
1. Coming home
1. Leaving home
1. Nighttime
1. Bedtime
1. Morning time (for when it's still dark)

## Coming home
Long time no movement. Then plenty of it.

**Scoring:**
Input                                       | Points
------------------------------------------- | -----
Any movement                                | 10
Movement does not stop within 30 seconds    | 20
Movement in another room within 30 seconds  | 20
Time matches typical home type              | 20
=========================================== | ====
Threshold                                   | 50

Threshold needs to be reached within one minute (otherwise score will be reset).

## Leaving home
Long time no movement

## Nighttime

## Morning time
