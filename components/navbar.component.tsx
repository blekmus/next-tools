import { Navbar, Group, ScrollArea, createStyles, Title, Text } from '@mantine/core'
import { IconHeart, IconHome2, IconTools } from '@tabler/icons'
import { NextPage } from 'next'
import LinksGroup from './navbar.links.component'

interface Props {
  activeGroup: string
  activeSubGroup?: string
}

const pathLinks = [
  { label: 'Dashboard', icon: IconHome2, id: 'dashboard', link: '/' },
  {
    label: 'Tools',
    icon: IconTools,
    id: 'tools',
    links: [
      { label: 'CSV to VCF', link: '/tools/csv-to-vcf', id: 'csv-to-vcf' },
      { label: 'Anilist Visualizer & Exporter', link: '/tools/anilist-exporter', id: 'anilist-exporter' },
    ],
  },
]

const useStyles = createStyles((theme) => ({
  navbar: {
    backgroundColor:
      theme.colorScheme === 'dark' ? theme.colors.dark[6] : theme.white,
    paddingBottom: 0,
  },

  header: {
    padding: theme.spacing.md,
    paddingTop: 0,
    marginLeft: -theme.spacing.md,
    marginRight: -theme.spacing.md,
    color: theme.colorScheme === 'dark' ? theme.white : theme.black,
    borderBottom: `1px solid ${
      theme.colorScheme === 'dark' ? theme.colors.dark[4] : theme.colors.gray[3]
    }`,
  },

  links: {
    marginLeft: -theme.spacing.md,
    marginRight: -theme.spacing.md,
  },

  linksInner: {
    paddingTop: theme.spacing.xl,
    paddingBottom: theme.spacing.xl,
  },

  footer: {
    marginLeft: -theme.spacing.md,
    marginRight: -theme.spacing.md,
    borderTop: `1px solid ${
      theme.colorScheme === 'dark' ? theme.colors.dark[4] : theme.colors.gray[3]
    }`,
  },
}))

const NavbarMain: NextPage<Props> = ({ activeGroup, activeSubGroup }) => {
  const { classes, theme } = useStyles()
  const links = pathLinks.map((item) => (
    <LinksGroup
      {...item}
      key={item.label}
      initiallyOpened={item.id === activeGroup ? true : false}
      activeSubGroup={activeSubGroup}
      link={item.link || null}
    />
  ))

  return (
    <Navbar width={{ sm: 300 }} p="md" className={classes.navbar}>
      <Navbar.Section className={classes.header}>
        <Group position="apart">
          <Title order={3}>Stuff</Title>
        </Group>
      </Navbar.Section>

      <Navbar.Section grow className={classes.links} component={ScrollArea}>
        <div className={classes.linksInner}>{links}</div>
      </Navbar.Section>

      <Navbar.Section className={classes.footer}>
        <Group position="center" mt="md" spacing={2}>
          <Text>Made with</Text>

          <IconHeart
            size={22}
            fill={theme.colors.dark[0]}
            style={{ paddingTop: '4px' }}
          />

          <Text>
            by <a style={{color: theme.colors.dark[0]}} target="_blank"  href="https://github.com/blekmus" rel="noreferrer">blekmus</a>
          </Text>
        </Group>
      </Navbar.Section>
    </Navbar>
  )
}

export default NavbarMain
